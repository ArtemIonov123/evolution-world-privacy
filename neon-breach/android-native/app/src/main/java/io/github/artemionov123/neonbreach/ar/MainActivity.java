package io.github.artemionov123.neonbreach.ar;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.hardware.display.DisplayManager;
import android.opengl.GLES11Ext;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import com.google.ar.core.ArCoreApk;
import com.google.ar.core.Camera;
import com.google.ar.core.CameraConfig;
import com.google.ar.core.CameraConfigFilter;
import com.google.ar.core.Config;
import com.google.ar.core.Frame;
import com.google.ar.core.Session;
import com.google.ar.core.TrackingState;
import com.google.ar.core.exceptions.CameraNotAvailableException;
import com.google.ar.core.exceptions.UnavailableArcoreNotInstalledException;
import com.google.ar.core.exceptions.UnavailableDeviceNotCompatibleException;
import com.google.ar.core.exceptions.UnavailableUserDeclinedInstallationException;

import org.json.JSONObject;

import java.util.EnumSet;
import java.util.List;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

/**
 * NEON BREACH with native ARCore.
 *
 * The game (assets/index.html) is drawn by a WebView. ARCore runs here, natively:
 *  1. The activity is locked to landscape in the manifest, BEFORE ARCore starts.
 *  2. The real screen size and rotation are passed to ARCore with setDisplayGeometry().
 *  3. The game receives Camera.getDisplayOrientedPose(): already aligned with the screen,
 *     so no extra 90-degree rotations are needed in the game.
 *  4. Game UI (WebView) and ARCore use the same, single screen orientation.
 *
 * ARCore needs a GL context to run. A 1x1 GLSurfaceView provides it; the camera image
 * is not shown (camera view is off in the game).
 */
public class MainActivity extends Activity implements GLSurfaceView.Renderer, DisplayManager.DisplayListener {
    private static final int REQ_CAMERA = 7;

    private final Handler ui = new Handler(Looper.getMainLooper());
    private WebView web;
    private GLSurfaceView glView;

    private volatile Session session;
    private volatile boolean running = false;   // ARCore session resumed
    private boolean wanted = false;             // game asked for AR
    private boolean installRequested = false;

    private int cameraTexture = -1;
    private volatile boolean textureBound = false;
    private volatile boolean geometryDirty = true;
    private volatile int viewWidth = 0, viewHeight = 0;

    private volatile String lastPose = "";
    private final float[] matrix = new float[16];

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        FrameLayout root = new FrameLayout(this);

        glView = new GLSurfaceView(this);
        glView.setPreserveEGLContextOnPause(true);
        glView.setEGLContextClientVersion(2);
        glView.setEGLConfigChooser(8, 8, 8, 8, 16, 0);
        glView.setRenderer(this);
        glView.setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
        root.addView(glView, new FrameLayout.LayoutParams(1, 1));

        WebView.setWebContentsDebuggingEnabled(true);
        web = new WebView(this);
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(), "NativeAR");
        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        root.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> {
            viewWidth = r - l;
            viewHeight = b - t;
            geometryDirty = true;
        });

        setContentView(root);
        hideSystemUi();

        DisplayManager dm = (DisplayManager) getSystemService(DISPLAY_SERVICE);
        if (dm != null) dm.registerDisplayListener(this, ui);

        web.loadUrl("file:///android_asset/index.html");
    }

    // ---------- JavaScript bridge: window.NativeAR ----------
    private class Bridge {
        @JavascriptInterface
        public String start() {
            ui.post(MainActivity.this::startAr);
            return "pending";
        }

        @JavascriptInterface
        public void stop() {
            ui.post(MainActivity.this::stopAr);
        }

        /** "T,m0..m15" tracking; "P,REASON" paused; "S" stopped; "E,NAME" error. */
        @JavascriptInterface
        public String pose() {
            return lastPose;
        }

        @JavascriptInterface
        public String info() {
            return "rotation=" + displayRotation() + " size=" + viewWidth + "x" + viewHeight;
        }
    }

    private void notifyJs(String state, String message) {
        ui.post(() -> {
            if (web == null) return;
            web.evaluateJavascript("window.onNativeAR&&window.onNativeAR("
                    + JSONObject.quote(state) + "," + JSONObject.quote(message) + ")", null);
        });
    }

    // ---------- ARCore lifecycle ----------
    private void startAr() {
        wanted = true;
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAMERA);
            notifyJs("permission", "Разреши доступ к камере: ARCore отслеживает по ней движение");
            return;
        }
        try {
            if (session == null) {
                ArCoreApk.InstallStatus st = ArCoreApk.getInstance().requestInstall(this, !installRequested);
                if (st == ArCoreApk.InstallStatus.INSTALL_REQUESTED) {
                    installRequested = true;
                    notifyJs("install", "Установи «Google Play Services for AR» и вернись в игру");
                    return;
                }
                Session s = new Session(this);
                try {
                    CameraConfigFilter filter = new CameraConfigFilter(s)
                            .setTargetFps(EnumSet.of(CameraConfig.TargetFps.TARGET_FPS_60));
                    List<CameraConfig> configs = s.getSupportedCameraConfigs(filter);
                    if (!configs.isEmpty()) s.setCameraConfig(configs.get(0));
                } catch (Exception ignored) {
                    // 60 fps camera is optional
                }
                Config config = new Config(s);
                config.setUpdateMode(Config.UpdateMode.LATEST_CAMERA_IMAGE);
                config.setPlaneFindingMode(Config.PlaneFindingMode.DISABLED);
                config.setLightEstimationMode(Config.LightEstimationMode.DISABLED);
                config.setFocusMode(Config.FocusMode.AUTO);
                s.configure(config);
                textureBound = false;
                session = s;
            }
            glView.onPause();
            session.resume();
            geometryDirty = true;
            running = true;
            glView.onResume();
            notifyJs("started", "ARCore запущен");
        } catch (UnavailableArcoreNotInstalledException | UnavailableUserDeclinedInstallationException e) {
            wanted = false;
            notifyJs("error", "Нужно приложение «Google Play Services for AR»");
        } catch (UnavailableDeviceNotCompatibleException e) {
            wanted = false;
            notifyJs("error", "Этот телефон не поддерживает ARCore");
        } catch (CameraNotAvailableException e) {
            wanted = false;
            notifyJs("error", "Камера занята другим приложением");
        } catch (Exception e) {
            wanted = false;
            notifyJs("error", "ARCore: " + e.getClass().getSimpleName() + " " + e.getMessage());
        }
    }

    private void stopAr() {
        wanted = false;
        running = false;
        lastPose = "S";
        if (session != null) {
            glView.onPause();
            session.pause();
            glView.onResume();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode != REQ_CAMERA) return;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
            if (wanted) startAr();
        } else {
            wanted = false;
            notifyJs("error", "Без камеры AR не работает");
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemUi();
        if (web != null) web.onResume();
        if (wanted && session == null && installRequested) {
            startAr(); // returned from Play Store after installing ARCore
        } else if (wanted && session != null) {
            try {
                session.resume();
                running = true;
                geometryDirty = true;
            } catch (Exception e) {
                notifyJs("error", "Камера недоступна после возврата в игру");
            }
        }
        glView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        running = false;
        glView.onPause();
        if (session != null) session.pause();
        if (web != null) web.onPause();
    }

    @Override
    protected void onDestroy() {
        DisplayManager dm = (DisplayManager) getSystemService(DISPLAY_SERVICE);
        if (dm != null) dm.unregisterDisplayListener(this);
        if (session != null) {
            session.close();
            session = null;
        }
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @SuppressWarnings("deprecation")
    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @SuppressWarnings("deprecation")
    private int displayRotation() {
        Display d = Build.VERSION.SDK_INT >= 30 ? getDisplay() : getWindowManager().getDefaultDisplay();
        return d == null ? 0 : d.getRotation();
    }

    // ---------- Display changes (phone flipped 180° between the two landscapes) ----------
    @Override public void onDisplayAdded(int displayId) { }
    @Override public void onDisplayRemoved(int displayId) { }
    @Override public void onDisplayChanged(int displayId) { geometryDirty = true; }

    // ---------- GL thread: ARCore update ----------
    @Override
    public void onSurfaceCreated(GL10 gl, EGLConfig config) {
        int[] tex = new int[1];
        GLES20.glGenTextures(1, tex, 0);
        cameraTexture = tex[0];
        GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, cameraTexture);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
        textureBound = false;
    }

    @Override
    public void onSurfaceChanged(GL10 gl, int width, int height) {
        GLES20.glViewport(0, 0, width, height);
    }

    @Override
    public void onDrawFrame(GL10 gl) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
        Session s = session;
        if (s == null || !running || cameraTexture < 0) return;
        try {
            if (!textureBound) {
                s.setCameraTextureName(cameraTexture);
                textureBound = true;
            }
            if (geometryDirty && viewWidth > 0 && viewHeight > 0) {
                // Real screen size + rotation: ARCore then reports a pose aligned with the screen.
                s.setDisplayGeometry(displayRotation(), viewWidth, viewHeight);
                geometryDirty = false;
            }
            Frame frame = s.update();
            Camera camera = frame.getCamera();
            TrackingState state = camera.getTrackingState();
            if (state == TrackingState.TRACKING) {
                camera.getDisplayOrientedPose().toMatrix(matrix, 0);
                StringBuilder sb = new StringBuilder(220).append('T');
                for (float v : matrix) sb.append(',').append(v);
                lastPose = sb.toString();
            } else if (state == TrackingState.PAUSED) {
                lastPose = "P," + camera.getTrackingFailureReason().name();
            } else {
                lastPose = "S";
            }
        } catch (Throwable e) {
            lastPose = "E," + e.getClass().getSimpleName();
        }
    }
}
