package com.toptanci.sales

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Base64
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsetsController
import android.webkit.*
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Sleek dark system bars
        window.statusBarColor = Color.parseColor("#060910")
        window.navigationBarColor = Color.parseColor("#060910")

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#060910"))
            isVerticalScrollBarEnabled = true
            isHorizontalScrollBarEnabled = false

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                loadWithOverviewMode = true
                useWideViewPort = true
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                cacheMode = WebSettings.LOAD_DEFAULT
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            // Register Native JavaScript Bridge for WhatsApp PDF Sharing & Intents
            addJavascriptInterface(WebAppInterface(this@MainActivity), "AndroidBridge")

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val url = request?.url?.toString() ?: return false
                    if (url.startsWith("tel:")) {
                        try {
                            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse(url))
                            dialIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            startActivity(dialIntent)
                            return true
                        } catch (e: Exception) {
                            view?.post {
                                view.evaluateJavascript("if (window.onPhoneDialerUnavailable) window.onPhoneDialerUnavailable('${url.removePrefix("tel:")}');", null)
                            }
                            return true
                        }
                    }
                    if (url.startsWith("whatsapp:") || 
                        url.startsWith("https://api.whatsapp.com") || 
                        url.startsWith("https://wa.me") || 
                        url.startsWith("mailto:") || 
                        url.startsWith("intent:")) {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            startActivity(intent)
                            return true
                        } catch (e: Exception) {
                            try {
                                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                startActivity(browserIntent)
                                return true
                            } catch (_: Exception) {}
                        }
                    }
                    return false
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    return super.onConsoleMessage(consoleMessage)
                }
            }

            // Load offline local application package
            loadUrl("file:///android_asset/index.html")
        }

        setContentView(webView)

        // Handle back button for modals and page navigation
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // If a modal is open in the app, close the modal via JS
                webView.evaluateJavascript(
                    """
                    (function() {
                        const openModal = document.querySelector('.modal-overlay:not(.hidden)');
                        if (openModal) {
                            openModal.classList.add('hidden');
                            return true;
                        }
                        return false;
                    })();
                    """.trimIndent()
                ) { result ->
                    if (result != "true") {
                        if (webView.canGoBack()) {
                            webView.goBack()
                        } else {
                            isEnabled = false
                            onBackPressedDispatcher.onBackPressed()
                        }
                    }
                }
            }
        })
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.destroy()
        }
        super.onDestroy()
    }
}

class WebAppInterface(private val context: Context) {

    @JavascriptInterface
    fun sharePdfViaWhatsApp(base64Pdf: String, fileName: String, rawPhone: String, text: String): Boolean {
        return try {
            val pdfData = Base64.decode(base64Pdf, Base64.DEFAULT)
            val cacheDir = File(context.cacheDir, "invoices")
            if (!cacheDir.exists()) cacheDir.mkdirs()
            val file = File(cacheDir, fileName)
            FileOutputStream(file).use { it.write(pdfData) }

            val uri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )

            var cleanPhone = rawPhone.replace(Regex("\\D"), "")
            if (cleanPhone.startsWith("0")) cleanPhone = "90" + cleanPhone.substring(1)
            else if (cleanPhone.length == 10) cleanPhone = "90" + cleanPhone

            // Explicitly grant read URI permission to WhatsApp and WhatsApp Business
            listOf("com.whatsapp", "com.whatsapp.w4b").forEach { pkg ->
                try {
                    context.grantUriPermission(pkg, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
                } catch (_: Exception) {}
            }

            val baseIntent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, uri)
                if (text.isNotBlank()) putExtra(Intent.EXTRA_TEXT, text)
                if (cleanPhone.isNotBlank()) putExtra("jid", "$cleanPhone@s.whatsapp.net")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            var launched = false
            // 1. Try standard WhatsApp
            try {
                val waIntent = Intent(baseIntent).apply {
                    setPackage("com.whatsapp")
                }
                context.startActivity(waIntent)
                launched = true
            } catch (e1: Exception) {
                // 2. Try WhatsApp Business
                try {
                    val waBizIntent = Intent(baseIntent).apply {
                        setPackage("com.whatsapp.w4b")
                    }
                    context.startActivity(waBizIntent)
                    launched = true
                } catch (e2: Exception) {
                    // 3. Fallback to system share chooser
                    val chooser = Intent.createChooser(baseIntent, "Faturayı WhatsApp ile Gönder").apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(chooser)
                    launched = true
                }
            }
            launched
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}
