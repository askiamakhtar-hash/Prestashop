package sn.libidor.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import sn.libidor.app.ui.LibidorApp
import sn.libidor.app.ui.LibidorTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            LibidorTheme {
                LibidorApp()
            }
        }
    }
}
