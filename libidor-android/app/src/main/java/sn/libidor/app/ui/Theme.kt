package sn.libidor.app.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Navy = Color(0xFF0B1F3A)
val Gold = Color(0xFFD4A73C)
val Sand = Color(0xFFF6F3EC)
val Success = Color(0xFF2E7D4F)
val Warning = Color(0xFFB7791F)
val Danger = Color(0xFFB3261E)

private val Light = lightColorScheme(
    primary = Navy,
    onPrimary = Color.White,
    secondary = Gold,
    onSecondary = Navy,
    background = Sand,
    surface = Color.White,
    surfaceVariant = Color(0xFFEDE7DA),
    secondaryContainer = Color(0xFFF3E3B8),
    onSecondaryContainer = Navy,
)

private val Dark = darkColorScheme(
    primary = Gold,
    onPrimary = Navy,
    secondary = Gold,
    onSecondary = Navy,
    background = Color(0xFF07152A),
    surface = Color(0xFF102844),
    surfaceVariant = Color(0xFF1A3456),
    secondaryContainer = Color(0xFF3A3018),
    onSecondaryContainer = Color(0xFFF3E3B8),
)

@Composable
fun LibidorTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (isSystemInDarkTheme()) Dark else Light, content = content)
}
