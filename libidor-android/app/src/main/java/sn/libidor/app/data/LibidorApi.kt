package sn.libidor.app.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

data class Transaction(
    val id: String,
    val amount: String,
    val currency: String,
    val status: String,
    val description: String,
    val customerReference: String?,
    val createdAt: String,
)

data class Metrics(val total: Int, val pending: Int, val succeeded: Int, val failed: Int)

data class Summary(val mode: String, val metrics: Metrics, val recent: List<Transaction>)

data class FxQuote(
    val sourceCurrency: String,
    val sourceAmount: String,
    val targetCurrency: String,
    val targetAmount: String,
    val indicativeRate: String,
    val expiresAt: String,
    val disclaimer: String,
)

class ApiException(message: String) : IOException(message)

/** Thin client for the LIBIDOR NestJS API (apps/api). */
class LibidorApi(private val baseUrl: String, private val apiKey: String) {

    suspend fun health(): Boolean = request("GET", "/health").optString("status") == "ok"

    suspend fun summary(): Summary {
        val o = request("GET", "/v1/dashboard/summary")
        val m = o.getJSONObject("metrics")
        return Summary(
            mode = o.optString("mode"),
            metrics = Metrics(
                m.optInt("totalTransactions"), m.optInt("pending"),
                m.optInt("succeeded"), m.optInt("failed"),
            ),
            recent = o.getJSONArray("recentTransactions").toTransactions(),
        )
    }

    suspend fun transactions(): List<Transaction> =
        JSONArray(raw("GET", "/v1/transactions")).toTransactions()

    suspend fun fxQuote(source: String, target: String, amount: Long): FxQuote {
        val body = JSONObject()
            .put("sourceCurrency", source)
            .put("targetCurrency", target)
            .put("amount", amount)
        val o = request("POST", "/v1/fx/quotes", body)
        return FxQuote(
            o.optString("sourceCurrency"), o.optString("sourceAmount"),
            o.optString("targetCurrency"), o.optString("targetAmount"),
            o.optString("indicativeRate"), o.optString("expiresAt"),
            o.optString("disclaimer"),
        )
    }

    suspend fun createPaymentIntent(
        amount: Long,
        currency: String,
        description: String,
        customerReference: String?,
    ): Transaction {
        val body = JSONObject()
            .put("amount", amount)
            .put("currency", currency)
            .put("description", description)
        if (!customerReference.isNullOrBlank()) body.put("customerReference", customerReference)
        val headers = mapOf("x-api-key" to apiKey, "idempotency-key" to UUID.randomUUID().toString())
        return request("POST", "/v1/merchant/payment-intents", body, headers).toTransaction()
    }

    suspend fun demoConfirm(id: String): Transaction =
        request("POST", "/v1/merchant/payment-intents/$id/demo-confirm", headers = mapOf("x-api-key" to apiKey))
            .toTransaction()

    private suspend fun request(
        method: String,
        path: String,
        body: JSONObject? = null,
        headers: Map<String, String> = emptyMap(),
    ): JSONObject = JSONObject(raw(method, path, body, headers))

    private suspend fun raw(
        method: String,
        path: String,
        body: JSONObject? = null,
        headers: Map<String, String> = emptyMap(),
    ): String = withContext(Dispatchers.IO) {
        val conn = URL(baseUrl.trimEnd('/') + path).openConnection() as HttpURLConnection
        try {
            conn.requestMethod = method
            conn.connectTimeout = 8000
            conn.readTimeout = 15000
            conn.setRequestProperty("Accept", "application/json")
            headers.forEach { (k, v) -> conn.setRequestProperty(k, v) }
            if (body != null) {
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                conn.outputStream.use { it.write(body.toString().toByteArray()) }
            }
            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            if (code !in 200..299) throw ApiException(errorMessage(code, text))
            text
        } finally {
            conn.disconnect()
        }
    }

    private fun errorMessage(code: Int, text: String): String {
        val msg = runCatching {
            val o = JSONObject(text)
            when (val m = o.opt("message")) {
                is JSONArray -> (0 until m.length()).joinToString("\n") { m.getString(it) }
                null -> o.optString("error")
                else -> m.toString()
            }
        }.getOrNull()
        return "HTTP $code" + if (msg.isNullOrBlank()) "" else " — $msg"
    }

    private fun JSONArray.toTransactions() = (0 until length()).map { getJSONObject(it).toTransaction() }

    private fun JSONObject.toTransaction() = Transaction(
        id = optString("id"),
        amount = optString("amount"),
        currency = optString("currency"),
        status = optString("status"),
        description = optString("description"),
        customerReference = optString("customerReference").takeIf { has("customerReference") && !isNull("customerReference") },
        createdAt = optString("createdAt"),
    )
}
