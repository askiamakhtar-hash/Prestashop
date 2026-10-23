package tech.libidor.app

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : ComponentActivity() {

    private lateinit var web: WebView
    private lateinit var swipe: SwipeRefreshLayout
    private lateinit var progress: ProgressBar
    private lateinit var offline: View

    /** True until the first page finishes, so the splash covers the initial load. */
    private var firstLoad = true
    private var mainFrameFailed = false

    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val pickFiles = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        fileCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data))
        fileCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        splash.setKeepOnScreenCondition { firstLoad }

        web = findViewById(R.id.web)
        swipe = findViewById(R.id.swipe)
        progress = findViewById(R.id.progress)
        offline = findViewById(R.id.offline)

        // targetSdk 35 draws edge-to-edge: keep content clear of the status and navigation bars.
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.root)) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            v.updatePadding(left = bars.left, top = bars.top, right = bars.right, bottom = bars.bottom)
            insets
        }

        swipe.setColorSchemeResources(R.color.gold)
        swipe.setProgressBackgroundColorSchemeResource(R.color.ink)
        swipe.setOnChildScrollUpCallback { _, _ -> web.scrollY > 0 }
        swipe.setOnRefreshListener { reload() }
        findViewById<Button>(R.id.retry).setOnClickListener { reload() }

        configureWebView()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (web.canGoBack()) web.goBack() else finish()
            }
        })

        if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
            web.loadUrl(intent?.data?.takeIf(::isSiteUrl)?.toString() ?: BuildConfig.SITE_URL)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        intent.data?.takeIf(::isSiteUrl)?.let { web.loadUrl(it.toString()) }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onPause() {
        super.onPause()
        web.onPause()
        CookieManager.getInstance().flush()
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
    }

    override fun onDestroy() {
        web.destroy()
        super.onDestroy()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            loadWithOverviewMode = true
            useWideViewPort = true
            setSupportZoom(false)
            userAgentString = "$userAgentString LibidorApp/${BuildConfig.VERSION_NAME}"
            cacheMode = if (isOnline()) WebSettings.LOAD_DEFAULT else WebSettings.LOAD_CACHE_ELSE_NETWORK
        }
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true)

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                return when (uri.scheme) {
                    "http", "https" -> if (isSiteUrl(uri)) false else openExternal(uri)
                    "blob", "data", "about", "javascript" -> false
                    else -> openExternal(uri) // tel:, mailto:, whatsapp:, intent:, market: …
                }
            }

            override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                mainFrameFailed = false
                progress.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView, url: String?) {
                firstLoad = false
                swipe.isRefreshing = false
                progress.visibility = View.GONE
                offline.visibility = if (mainFrameFailed) View.VISIBLE else View.GONE
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                // Sub-resource failures (missing videos, the site's API) must not hide the page.
                if (request.isForMainFrame) {
                    mainFrameFailed = true
                    firstLoad = false
                    offline.visibility = View.VISIBLE
                }
            }
        }

        web.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                progress.progress = newProgress
            }

            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams,
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                return try {
                    pickFiles.launch(Intent.createChooser(params.createIntent(), getString(R.string.choose_file)))
                    true
                } catch (e: ActivityNotFoundException) {
                    fileCallback = null
                    false
                }
            }
        }

        web.setDownloadListener { url, _, _, _, _ -> openExternal(Uri.parse(url)) }
    }

    private fun reload() {
        web.settings.cacheMode = if (isOnline()) WebSettings.LOAD_DEFAULT else WebSettings.LOAD_CACHE_ELSE_NETWORK
        offline.visibility = View.GONE
        if (web.url.isNullOrEmpty() || web.url == "about:blank") web.loadUrl(BuildConfig.SITE_URL) else web.reload()
    }

    private fun isSiteUrl(uri: Uri): Boolean {
        val host = uri.host ?: return false
        return host == "libidor.tech" || host.endsWith(".libidor.tech")
    }

    private fun openExternal(uri: Uri): Boolean {
        val intent = if (uri.scheme == "intent") {
            runCatching { Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME) }.getOrNull()
        } else {
            Intent(Intent.ACTION_VIEW, uri)
        }
        try {
            if (intent != null) startActivity(intent.addCategory(Intent.CATEGORY_BROWSABLE)) else throw ActivityNotFoundException()
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, R.string.no_app, Toast.LENGTH_SHORT).show()
        }
        return true
    }

    private fun isOnline(): Boolean {
        val cm = getSystemService(ConnectivityManager::class.java) ?: return true
        val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
