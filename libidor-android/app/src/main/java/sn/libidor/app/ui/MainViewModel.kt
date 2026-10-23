package sn.libidor.app.ui

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import sn.libidor.app.data.FxQuote
import sn.libidor.app.data.LibidorApi
import sn.libidor.app.data.Settings
import sn.libidor.app.data.Summary
import sn.libidor.app.data.Transaction

class MainViewModel(app: Application) : AndroidViewModel(app) {
    private val settings = Settings(app)
    private var api = LibidorApi(settings.apiUrl, settings.apiKey)

    var apiUrl by mutableStateOf(settings.apiUrl); private set
    var apiKey by mutableStateOf(settings.apiKey); private set

    var online by mutableStateOf<Boolean?>(null); private set
    var loading by mutableStateOf(false); private set
    var summary by mutableStateOf<Summary?>(null); private set
    var transactions by mutableStateOf<List<Transaction>>(emptyList()); private set
    var error by mutableStateOf<String?>(null); private set

    var quote by mutableStateOf<FxQuote?>(null); private set
    var quoteError by mutableStateOf<String?>(null); private set
    var quoting by mutableStateOf(false); private set

    var lastIntent by mutableStateOf<Transaction?>(null); private set
    var intentError by mutableStateOf<String?>(null); private set
    var intentBusy by mutableStateOf(false); private set

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        loading = true
        error = null
        try {
            summary = api.summary()
            transactions = api.transactions()
            online = true
        } catch (e: Exception) {
            online = false
            error = e.message ?: e.javaClass.simpleName
        } finally {
            loading = false
        }
    }

    fun requestQuote(source: String, target: String, amount: Long) = viewModelScope.launch {
        quoting = true
        quoteError = null
        try {
            quote = api.fxQuote(source, target, amount)
        } catch (e: Exception) {
            quote = null
            quoteError = e.message
        } finally {
            quoting = false
        }
    }

    fun createIntent(amount: Long, currency: String, description: String, reference: String?) =
        viewModelScope.launch {
            intentBusy = true
            intentError = null
            try {
                lastIntent = api.createPaymentIntent(amount, currency, description, reference)
                refresh()
            } catch (e: Exception) {
                intentError = e.message
            } finally {
                intentBusy = false
            }
        }

    fun confirm(id: String) = viewModelScope.launch {
        intentBusy = true
        intentError = null
        try {
            val confirmed = api.demoConfirm(id)
            if (lastIntent?.id == id) lastIntent = confirmed
            refresh()
        } catch (e: Exception) {
            intentError = e.message
        } finally {
            intentBusy = false
        }
    }

    fun saveSettings(url: String, key: String) {
        settings.apiUrl = url
        settings.apiKey = key
        apiUrl = settings.apiUrl
        apiKey = settings.apiKey
        api = LibidorApi(apiUrl, apiKey)
        refresh()
    }
}
