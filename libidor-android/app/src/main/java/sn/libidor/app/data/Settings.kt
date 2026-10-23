package sn.libidor.app.data

import android.content.Context
import sn.libidor.app.BuildConfig

/** Persists the API endpoint and merchant key entered in the settings screen. */
class Settings(context: Context) {
    private val prefs = context.getSharedPreferences("libidor", Context.MODE_PRIVATE)

    var apiUrl: String
        get() = prefs.getString("api_url", null) ?: BuildConfig.DEFAULT_API_URL
        set(value) = prefs.edit().putString("api_url", value.trim()).apply()

    var apiKey: String
        get() = prefs.getString("api_key", null) ?: BuildConfig.DEFAULT_API_KEY
        set(value) = prefs.edit().putString("api_key", value.trim()).apply()
}
