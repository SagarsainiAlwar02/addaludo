package com.addaludo.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends Activity {

    private WebView webView;
    private ProgressBar progressBar;
    private View errorLayout;
    private TextView errorMsg;
    private ImageView splashScreen;
    private SwipeRefreshLayout swipeRefresh;
    private boolean splashDismissed = false;

    private static final String WEBSITE_URL = "https://addaludo.com";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fullscreen immersive
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        setContentView(R.layout.activity_main);

        // Hide action bar
        if (getActionBar() != null) {
            getActionBar().hide();
        }

        progressBar = findViewById(R.id.progressBar);
        errorLayout = findViewById(R.id.errorLayout);
        errorMsg = findViewById(R.id.errorMsg);
        webView = findViewById(R.id.webView);
        splashScreen = findViewById(R.id.splashScreen);
        swipeRefresh = findViewById(R.id.swipeRefresh);

        setupWebView();
        setupSwipeRefresh();
        loadWebsite();
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        // Enable JavaScript
        settings.setJavaScriptEnabled(true);

        // Enable DOM storage (needed for localStorage)
        settings.setDomStorageEnabled(true);

        // Enable database storage
        settings.setDatabaseEnabled(true);

        // Enable file access
        settings.setAllowFileAccess(true);

        // Enable zoom support
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);

        // Responsive viewport
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // Cache mode
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Enable mixed content (http + https)
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Enable cookies (important for login sessions)
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // Handle page loading
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
                errorLayout.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                hideSplash();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request,
                                        WebResourceError error) {
                super.onReceivedError(view, request, error);
                // Only handle main frame errors
                if (request.isForMainFrame()) {
                    progressBar.setVisibility(View.GONE);
                    showNoInternet();
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // Open external links (WhatsApp, UPI, etc.) in external apps
                if (url.startsWith("whatsapp:") || url.startsWith("upi://")
                    || url.startsWith("intent:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception e) {
                        // App not installed, ignore
                    }
                    return true;
                }

                // Keep internal links inside the WebView
                if (url.contains("addaludo.com")) {
                    return false;
                }

                // Other external links open in browser
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                return true;
            }
        });

        // Handle file upload, geolocation, etc.
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress == 100) {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                                                           GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }
        });

        // Enable hardware acceleration for smoother rendering
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
    }

    private void setupSwipeRefresh() {
        swipeRefresh.setColorSchemeColors(0xFF3b82f6);
        swipeRefresh.setOnRefreshListener(() -> {
            webView.reload();
        });
    }

    private void loadWebsite() {
        if (isNetworkAvailable()) {
            webView.loadUrl(WEBSITE_URL);
        } else {
            showNoInternet();
        }
    }

    private void showNoInternet() {
        progressBar.setVisibility(View.GONE);
        errorLayout.setVisibility(View.VISIBLE);
        errorMsg.setText("No internet connection.\nPlease check your network and try again.");
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (cm != null) {
            NetworkInfo info = cm.getActiveNetworkInfo();
            return info != null && info.isConnected();
        }
        return false;
    }

    // Handle Android back button — go back in WebView history
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }

        // If no history, minimize instead of closing
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            moveTaskToBack(true);
            return true;
        }

        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    private void hideSplash() {
        if (splashDismissed) return;
        splashDismissed = true;

        splashScreen.post(() -> {
            // Switch status bar and nav bar to dark (matching website theme)
            getWindow().setStatusBarColor(0xFF0f172a);
            getWindow().setNavigationBarColor(0xFF0f172a);

            AlphaAnimation fadeOut = new AlphaAnimation(1.0f, 0.0f);
            fadeOut.setDuration(300);
            fadeOut.setAnimationListener(new Animation.AnimationListener() {
                @Override
                public void onAnimationStart(Animation anim) {}

                @Override
                public void onAnimationEnd(Animation anim) {
                    splashScreen.setVisibility(View.GONE);
                }

                @Override
                public void onAnimationRepeat(Animation anim) {}
            });
            splashScreen.startAnimation(fadeOut);
        });
    }

    // Called from XML onClick for retry button
    public void retryLoading(View view) {
        loadWebsite();
    }
}
