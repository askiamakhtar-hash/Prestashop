package sn.libidor.app.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCard
import androidx.compose.material.icons.filled.CurrencyExchange
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

private enum class Tab(val label: String, val icon: ImageVector) {
    Overview("Accueil", Icons.Filled.Dashboard),
    Transactions("Transactions", Icons.Filled.ReceiptLong),
    Fx("Change", Icons.Filled.CurrencyExchange),
    Collect("Encaisser", Icons.Filled.AddCard),
    Settings("Réglages", Icons.Filled.Settings),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibidorApp(vm: MainViewModel = viewModel()) {
    var tab by rememberSaveable { mutableIntStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("◉ LIBIDOR", fontWeight = FontWeight.Bold, color = Gold)
                        Text(
                            "L’ESPRIT DU CAURI, LA PUISSANCE DU DIGITAL",
                            fontSize = 9.sp, color = Color.White.copy(alpha = 0.7f),
                        )
                    }
                },
                actions = { StatusChip(vm.online) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Navy),
            )
        },
        bottomBar = {
            NavigationBar {
                Tab.entries.forEach {
                    NavigationBarItem(
                        selected = tab == it.ordinal,
                        onClick = { tab = it.ordinal },
                        icon = { Icon(it.icon, contentDescription = it.label) },
                        label = { Text(it.label, fontSize = 11.sp, maxLines = 1) },
                    )
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        val m = Modifier.padding(padding)
        when (Tab.entries[tab]) {
            Tab.Overview -> OverviewScreen(vm, m)
            Tab.Transactions -> TransactionsScreen(vm, m)
            Tab.Fx -> FxScreen(vm, m)
            Tab.Collect -> CollectScreen(vm, m)
            Tab.Settings -> SettingsScreen(vm, m)
        }
    }
}
