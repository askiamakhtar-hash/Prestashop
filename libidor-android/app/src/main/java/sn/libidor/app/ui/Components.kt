package sn.libidor.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import sn.libidor.app.data.Transaction
import java.text.NumberFormat
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

private val fr = Locale.FRANCE

fun formatAmount(amount: String, currency: String): String =
    (amount.toLongOrNull()?.let { NumberFormat.getIntegerInstance(fr).format(it) } ?: amount) + " " + currency

fun formatDate(iso: String): String = runCatching {
    OffsetDateTime.parse(iso).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", fr))
}.getOrDefault(iso)

@Composable
fun StatusChip(online: Boolean?) {
    val (color, label) = when (online) {
        true -> Success to "API connectée"
        false -> Danger to "API hors ligne"
        null -> Color.Gray to "Connexion…"
    }
    Row(
        Modifier
            .padding(end = 12.dp)
            .clip(RoundedCornerShape(50))
            .background(Color.White.copy(alpha = 0.1f))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Spacer(Modifier.size(8.dp).clip(CircleShape).background(color))
        Spacer(Modifier.width(6.dp))
        Text(label, color = Color.White, fontSize = 12.sp)
    }
}

@Composable
fun SectionTitle(text: String, subtitle: String? = null) {
    Column(Modifier.padding(top = 8.dp, bottom = 4.dp)) {
        Text(text, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        if (subtitle != null) {
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun StatusPill(status: String) {
    val color = when (status) {
        "SUCCEEDED" -> Success
        "PENDING", "PROCESSING" -> Warning
        "FAILED", "CANCELLED" -> Danger
        else -> Color.Gray
    }
    Text(
        status,
        color = color,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 8.dp, vertical = 2.dp),
    )
}

@Composable
fun TransactionRow(t: Transaction, trailing: (@Composable () -> Unit)? = null) {
    Card(
        Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(t.description, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    t.id.take(10).uppercase() + " · " + formatDate(t.createdAt),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(formatAmount(t.amount, t.currency), fontWeight = FontWeight.SemiBold)
                StatusPill(t.status)
            }
        }
        if (trailing != null) Row(Modifier.padding(start = 14.dp, end = 14.dp, bottom = 10.dp)) { trailing() }
    }
}

@Composable
fun DevNotice() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(
            "Mode développement. Aucun paiement réel n’est traité. Les connexions banque, Mobile Money, " +
                "PI-SPI, CIPS et réseaux de cartes ne sont pas activées. Les cotations FX sont simulées et non exécutables.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSecondaryContainer,
            modifier = Modifier.padding(14.dp),
        )
    }
}

@Composable
fun ErrorText(message: String?) {
    if (message != null) Text(message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
}
