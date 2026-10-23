package sn.libidor.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp

private val screenPadding = PaddingValues(16.dp)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OverviewScreen(vm: MainViewModel, modifier: Modifier) {
    PullToRefreshBox(isRefreshing = vm.loading, onRefresh = { vm.refresh() }, modifier = modifier.fillMaxSize()) {
        LazyColumn(contentPadding = screenPadding, verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item {
                Text("Espace d’administration", style = MaterialTheme.typography.labelMedium, color = Gold)
                Text("Vue d’ensemble", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            }
            item {
                val m = vm.summary?.metrics
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        MetricCard("Transactions", m?.total, Modifier.weight(1f))
                        MetricCard("En attente", m?.pending, Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        MetricCard("Réussies (démo)", m?.succeeded, Modifier.weight(1f))
                        MetricCard("Échouées", m?.failed, Modifier.weight(1f))
                    }
                }
            }
            item { SectionTitle("Transactions récentes") }
            val recent = vm.summary?.recent.orEmpty()
            if (recent.isEmpty()) {
                item {
                    Text(
                        if (vm.online == true) "Aucune transaction pour le moment."
                        else "Démarrez l’API et PostgreSQL, puis vérifiez l’URL dans Réglages.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    ErrorText(vm.error)
                }
            } else {
                items(recent, key = { it.id }) { TransactionRow(it) }
            }
            item { DevNotice() }
        }
    }
}

@Composable
private fun MetricCard(label: String, value: Int?, modifier: Modifier) {
    Card(modifier, colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(14.dp)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value?.toString() ?: "—", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionsScreen(vm: MainViewModel, modifier: Modifier) {
    PullToRefreshBox(isRefreshing = vm.loading, onRefresh = { vm.refresh() }, modifier = modifier.fillMaxSize()) {
        LazyColumn(contentPadding = screenPadding, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item { SectionTitle("Transactions", "100 dernières intentions de paiement") }
            if (vm.transactions.isEmpty()) {
                item {
                    Text("Aucune transaction.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    ErrorText(vm.error)
                }
            }
            items(vm.transactions, key = { it.id }) { t ->
                TransactionRow(t, trailing = if (t.status == "PENDING") {
                    { OutlinedButton(onClick = { vm.confirm(t.id) }, enabled = !vm.intentBusy) { Text("Confirmer (démo)") } }
                } else null)
            }
        }
    }
}

@Composable
fun FxScreen(vm: MainViewModel, modifier: Modifier) {
    var source by rememberSaveable { mutableStateOf("XOF") }
    var amount by rememberSaveable { mutableStateOf("25000") }
    val target = if (source == "XOF") "CNY" else "XOF"
    val parsed = amount.toLongOrNull()

    Column(
        modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        SectionTitle("Change XOF / CNY", "Cotation indicative simulée, non exécutable")
        Row(verticalAlignment = Alignment.CenterVertically) {
            FilterChip(selected = true, onClick = {}, label = { Text(source) })
            IconButton(onClick = { source = target }) { Icon(Icons.Filled.SwapHoriz, "Inverser") }
            FilterChip(selected = false, onClick = { source = target }, label = { Text(target) })
        }
        OutlinedTextField(
            value = amount,
            onValueChange = { amount = it.filter(Char::isDigit) },
            label = { Text("Montant ($source)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Button(
            onClick = { parsed?.let { vm.requestQuote(source, target, it) } },
            enabled = parsed != null && parsed > 0 && !vm.quoting,
            modifier = Modifier.fillMaxWidth(),
        ) { Text(if (vm.quoting) "Calcul…" else "Obtenir une cotation") }
        ErrorText(vm.quoteError)
        vm.quote?.let { q ->
            Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(formatAmount(q.sourceAmount, q.sourceCurrency), style = MaterialTheme.typography.titleMedium)
                    Text("≈ " + formatAmount(q.targetAmount, q.targetCurrency), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text("Taux indicatif : ${q.indicativeRate}", style = MaterialTheme.typography.bodySmall)
                    Text("Expire : ${formatDate(q.expiresAt)}", style = MaterialTheme.typography.bodySmall)
                    Text(q.disclaimer, style = MaterialTheme.typography.bodySmall, color = Warning)
                }
            }
        }
    }
}

@Composable
fun CollectScreen(vm: MainViewModel, modifier: Modifier) {
    var amount by rememberSaveable { mutableStateOf("") }
    var currency by rememberSaveable { mutableStateOf("XOF") }
    var description by rememberSaveable { mutableStateOf("") }
    var reference by rememberSaveable { mutableStateOf("") }
    val parsed = amount.toLongOrNull()

    Column(
        modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        SectionTitle("Nouvel encaissement", "Crée une intention de paiement via l’API marchand")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("XOF", "CNY").forEach {
                FilterChip(selected = currency == it, onClick = { currency = it }, label = { Text(it) })
            }
        }
        OutlinedTextField(
            value = amount, onValueChange = { amount = it.filter(Char::isDigit) },
            label = { Text("Montant ($currency)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true, modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = description, onValueChange = { description = it },
            label = { Text("Description") }, singleLine = true, modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = reference, onValueChange = { reference = it },
            label = { Text("Référence client (optionnel)") }, singleLine = true, modifier = Modifier.fillMaxWidth(),
        )
        Button(
            onClick = { vm.createIntent(parsed!!, currency, description.trim(), reference.trim().ifBlank { null }) },
            enabled = parsed != null && parsed > 0 && description.isNotBlank() && !vm.intentBusy,
            modifier = Modifier.fillMaxWidth(),
        ) { Text(if (vm.intentBusy) "Envoi…" else "Créer l’intention") }
        ErrorText(vm.intentError)
        vm.lastIntent?.let { t ->
            SectionTitle("Dernière intention créée")
            TransactionRow(t, trailing = if (t.status == "PENDING") {
                { OutlinedButton(onClick = { vm.confirm(t.id) }, enabled = !vm.intentBusy) { Text("Confirmer (démo)") } }
            } else null)
            Text("La confirmation démo change uniquement le statut en base ; aucun fonds n’est déplacé.",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun SettingsScreen(vm: MainViewModel, modifier: Modifier) {
    var url by rememberSaveable { mutableStateOf(vm.apiUrl) }
    var key by rememberSaveable { mutableStateOf(vm.apiKey) }

    Column(
        modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        SectionTitle("Réglages", "Connexion à l’API LIBIDOR")
        OutlinedTextField(
            value = url, onValueChange = { url = it }, label = { Text("URL de l’API") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
            singleLine = true, modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = key, onValueChange = { key = it }, label = { Text("Clé API marchand (x-api-key)") },
            visualTransformation = PasswordVisualTransformation(),
            singleLine = true, modifier = Modifier.fillMaxWidth(),
        )
        Button(onClick = { vm.saveSettings(url, key) }, modifier = Modifier.fillMaxWidth()) {
            Text("Enregistrer et tester")
        }
        when (vm.online) {
            true -> Text("Connexion réussie.", color = Success)
            false -> ErrorText("Échec de connexion : ${vm.error}")
            null -> {}
        }
        Text(
            "Émulateur Android : http://10.0.2.2:4000 pointe vers la machine hôte.\n" +
                "Téléphone physique : utilisez l’IP locale de l’ordinateur (ex. http://192.168.1.20:4000) " +
                "sur le même réseau Wi-Fi.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        DevNotice()
    }
}
