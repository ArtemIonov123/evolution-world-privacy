package io.github.neonblocks.hands;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.media.Image;
import android.opengl.GLES11Ext;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Display;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;

import com.google.ar.core.ArCoreApk;
import com.google.ar.core.Camera;
import com.google.ar.core.Frame;
import com.google.ar.core.Session;
import com.google.ar.core.TrackingState;
import com.google.ar.core.exceptions.NotYetAvailableException;

import org.json.JSONObject;

import java.util.Locale;
import java.util.concurrent.atomic.AtomicReference;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

/** Standalone Android replacement for the old NativeAR shell. */
public class MainActivity extends Activity implements GLSurfaceView.Renderer {
    private static final String TAG="NEON-AR-HANDS";
    private static final int CAMERA_REQUEST=71;
    private final Handler ui=new Handler(Looper.getMainLooper());
    private final Object arLock=new Object();
    private final AtomicReference<String> pose=new AtomicReference<>("P,waiting");
    private WebView web;
    private GLSurfaceView glView;
    private HandTracker tracker;
    private volatile Session session;
    private volatile boolean running=false,requested=false,resumed=false;
    private boolean installRequested=false;
    private int glTexture;
    private int viewW=1,viewH=1;
    private volatile int rotation=0;
    private long lastHandsNs=0L;
    private volatile int sensorRotation=90;

    @Override public void onCreate(Bundle b){super.onCreate(b);
        getWindow().getDecorView().setSystemUiVisibility(
          View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_FULLSCREEN|
          View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|
          View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        tracker=new HandTracker(this,new HandTracker.OnHands(){
            @Override public void frame(JSONObject data){
                final String json=data.toString();
                ui.post(()->{if(web!=null&&!isFinishing())
                    web.evaluateJavascript("window.onNativeHandLandmarks&&window.onNativeHandLandmarks("+json+")",null);});
            }
            @Override public void error(String message){
                final String safe=JSONObject.quote(message);
                ui.post(()->{if(web!=null&&!isFinishing())
                    web.evaluateJavascript("window.onNativeHandError&&window.onNativeHandError("+safe+")",null);});
            }
        });
        FrameLayout layout=new FrameLayout(this);
        glView=new GLSurfaceView(this);
        glView.setEGLContextClientVersion(2);
        glView.setPreserveEGLContextOnPause(true);
        glView.setRenderer(this);
        glView.setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
        layout.addView(glView,new FrameLayout.LayoutParams(-1,-1));
        web=new WebView(this);
        web.setBackgroundColor(0xff05151e);
        WebSettings ws=web.getSettings();
        ws.setJavaScriptEnabled(true);ws.setDomStorageEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setAllowFileAccess(true);
        // Asset page is trusted, untrusted external navigation is blocked.
        web.setWebViewClient(new android.webkit.WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,android.webkit.WebResourceRequest r){
                return !"file".equalsIgnoreCase(r.getUrl().getScheme());
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new NativeBridge(),"NativeAR");
        layout.addView(web,new FrameLayout.LayoutParams(-1,-1));
        setContentView(layout);
        web.loadUrl("file:///android_asset/index.html");
        glView.setOnLayoutChangeListener((v,l,t,r,bm,ol,ot,or,ob)->{
            viewW=Math.max(1,r-l);viewH=Math.max(1,bm-t);
            updateRotation();
        });
        updateRotation();
    }

    private void updateRotation(){
        @SuppressWarnings("deprecation")
        Display display=android.os.Build.VERSION.SDK_INT>=30?getDisplay():getWindowManager().getDefaultDisplay();
        if(display!=null)rotation=display.getRotation();
    }
    private int screenRotationDegrees(){return ((rotation%4)+4)%4*90;}
    private int imageRotationDegrees(){return (sensorRotation-screenRotationDegrees()+360)%360;}

    private void startAR(){
        requested=true;
        if(checkSelfPermission(Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED){
            requestPermissions(new String[]{Manifest.permission.CAMERA},CAMERA_REQUEST);
            pose.set("P,permission");return;
        }
        try {
            if(ArCoreApk.getInstance().requestInstall(this,!installRequested)==ArCoreApk.InstallStatus.INSTALL_REQUESTED){
                installRequested=true;pose.set("P,install-arcore");return;
            }
            synchronized(arLock){
            if(session==null){
                session=new Session(this);
                try {
                    String id=session.getCameraConfig().getCameraId();
                    CameraManager mgr=(CameraManager)getSystemService(CAMERA_SERVICE);
                    Integer o=mgr.getCameraCharacteristics(id).get(CameraCharacteristics.SENSOR_ORIENTATION);
                    if(o!=null)sensorRotation=o;
                }catch(Exception e){Log.w(TAG,"camera orientation",e);}
            }
            if(resumed){session.resume();running=true;pose.set("P,tracking");}
            else {pose.set("P,resume");}
            }
        }catch(Exception e){running=false;pose.set("E,"+e.getClass().getSimpleName());
            sendNativeStatus("error","ARCore: "+e.getMessage());Log.e(TAG,"AR init failed",e);
        }
    }
    private void stopAR(){
        requested=false;running=false;
        try{synchronized(arLock){if(session!=null)session.pause();}}catch(Exception e){Log.w(TAG,"pause",e);}
        pose.set("P,stopped");
    }
    private void sendNativeStatus(String state,String message){
        final String js="window.onNativeAR&&window.onNativeAR("+JSONObject.quote(state)+","+JSONObject.quote(message)+")";
        ui.post(()->{if(web!=null&&!isFinishing())web.evaluateJavascript(js,null);});
    }

    @Override protected void onResume(){super.onResume();resumed=true;if(glView!=null)glView.onResume();if(requested)startAR();}
    @Override protected void onPause(){resumed=false;
        if(glView!=null)glView.onPause();
        if(session!=null&&running){try{synchronized(arLock){session.pause();}}catch(Exception e){Log.w(TAG,"pause",e);}running=false;}
        super.onPause();
    }
    @Override protected void onDestroy(){running=false;requested=false;
        try{synchronized(arLock){if(session!=null)session.close();}}catch(Exception e){Log.w(TAG,"session.close",e);}
        session=null;tracker.close();
        if(web!=null){web.destroy();web=null;}
        super.onDestroy();
    }
    @Override public void onRequestPermissionsResult(int requestCode,String[] perms,int[] results){
        super.onRequestPermissionsResult(requestCode,perms,results);
        if(requestCode==CAMERA_REQUEST){
            if(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED)startAR();
            else{requested=false;pose.set("E,permission-denied");sendNativeStatus("error","Разреши доступ к камере Android");}
        }
    }

    @Override public void onSurfaceCreated(GL10 gl,EGLConfig config){
        int[] a=new int[1];GLES20.glGenTextures(1,a,0);glTexture=a[0];
        GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,glTexture);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GLES20.GL_TEXTURE_MIN_FILTER,GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GLES20.GL_TEXTURE_MAG_FILTER,GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GLES20.GL_TEXTURE_WRAP_S,GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GLES20.GL_TEXTURE_WRAP_T,GLES20.GL_CLAMP_TO_EDGE);
    }
    @Override public void onSurfaceChanged(GL10 gl,int width,int height){viewW=Math.max(1,width);viewH=Math.max(1,height);}
    @Override public void onDrawFrame(GL10 gl){
        // The GLSurfaceView provides the EGL context required for Session.update().
        Session s=session;
        if(!running||s==null||glTexture==0)return;
        try {
            synchronized(arLock){
            if(!running||session!=s)return;
            s.setCameraTextureName(glTexture);
            s.setDisplayGeometry(rotation,viewW,viewH);
            Frame f=s.update();
            Camera c=f.getCamera();
            if(c.getTrackingState()==TrackingState.TRACKING){
                float[] m=new float[16];c.getDisplayOrientedPose().toMatrix(m,0);
                StringBuilder result=new StringBuilder(208).append("T");
                for(float n:m)result.append(',').append(String.format(Locale.US,"%.6f",n));
                pose.set(result.toString());
            }else{pose.set("P,tracking");}
            long now=android.os.SystemClock.elapsedRealtimeNanos();
            if(tracker.wantsFrames() && now-lastHandsNs>90_000_000L){
                lastHandsNs=now;
                try{
                    Image image=f.acquireCameraImage();
                    tracker.onCameraImage(image,imageRotationDegrees());
                }catch(NotYetAvailableException ignore){ }
                catch(Exception e){Log.w(TAG,"CPU frame",e);}
            }
            }
        }catch(Exception e){pose.set("E,"+e.getClass().getSimpleName());
            Log.w(TAG,"ARCore update",e);
        }
    }

    public final class NativeBridge {
        @JavascriptInterface public void start(){ui.post(MainActivity.this::startAR);}
        @JavascriptInterface public void stop(){ui.post(MainActivity.this::stopAR);}
        @JavascriptInterface public String pose(){return pose.get();}
        @JavascriptInterface public String info(){return "ARCore + MediaPipe HandLandmarker • "+tracker.info();}
        @JavascriptInterface public void startHands(){tracker.start();}
        @JavascriptInterface public void stopHands(){tracker.stop();}
        @JavascriptInterface public String handsInfo(){return tracker.info();}
    }
}
