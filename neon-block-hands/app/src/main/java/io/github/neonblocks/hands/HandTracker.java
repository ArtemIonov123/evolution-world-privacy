package io.github.neonblocks.hands;

import android.content.Context;
import android.graphics.Bitmap;
import android.media.Image;
import android.os.SystemClock;
import android.util.Log;

import com.google.mediapipe.framework.image.BitmapImageBuilder;
import com.google.mediapipe.framework.image.MPImage;
import com.google.mediapipe.tasks.components.containers.Category;
import com.google.mediapipe.tasks.components.containers.Landmark;
import com.google.mediapipe.tasks.components.containers.NormalizedLandmark;
import com.google.mediapipe.tasks.core.BaseOptions;
import com.google.mediapipe.tasks.vision.core.RunningMode;
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker;
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarkerResult;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.nio.ByteBuffer;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * HandLandmarker runs on a worker thread. ARCore's Image is copied and closed
 * on the GL thread before inference. Only 21 landmarks/hand go to JS.
 */
final class HandTracker {
    interface OnHands { void frame(JSONObject hands); void error(String problem); }

    private final Context context;
    private final OnHands listener;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean busy = new AtomicBoolean(false);
    private final AtomicBoolean requested = new AtomicBoolean(false);
    private HandLandmarker landmarker;
    private long lastFrameMillis;
    private volatile long lastInferenceMillis;
    private volatile String status = "Выключено";

    HandTracker(Context context, OnHands listener) { this.context=context; this.listener=listener; }
    void start() {
        requested.set(true);
        status="Инициализация MediaPipe";
        worker.execute(() -> {
            if (!requested.get()) return;
            try {
                if (landmarker==null) {
                    BaseOptions base=BaseOptions.builder().setModelAssetPath("hand_landmarker.task").build();
                    HandLandmarker.HandLandmarkerOptions options=HandLandmarker.HandLandmarkerOptions.builder()
                        .setBaseOptions(base).setRunningMode(RunningMode.VIDEO).setNumHands(2)
                        .setMinHandDetectionConfidence(.55f)
                        .setMinHandPresenceConfidence(.50f)
                        .setMinTrackingConfidence(.50f).build();
                    landmarker=HandLandmarker.createFromOptions(context,options);
                }
                status="Поиск рук";
            } catch (Exception e) {
                requested.set(false);status="Ошибка модели: "+e.getMessage();
                listener.error(status); Log.e("NEON-HANDS",status,e);
            }
        });
    }
    void stop(){requested.set(false);status="Выключено";}
    boolean wantsFrames(){return requested.get()&&landmarker!=null;}
    String info(){return status;}
    void close(){requested.set(false);worker.execute(()->{if(landmarker!=null){landmarker.close();landmarker=null;}});worker.shutdown();}

    /** Called on the active ARCore GL thread at most 12Hz. Always closes Image. */
    void onCameraImage(Image img,int rotationDeg,final float[] intr) {
        try {
            if (!wantsFrames()||!busy.compareAndSet(false,true)) return;
            final Bitmap small=toBitmap(img,320,rotationDeg);
            final long timestamp=Math.max(SystemClock.uptimeMillis(),lastInferenceMillis+1);
            worker.execute(() -> {
                try {
                    if (!requested.get()||landmarker==null) return;
                    MPImage in=new BitmapImageBuilder(small).build();
                    HandLandmarkerResult result=landmarker.detectForVideo(in,timestamp);
                    lastInferenceMillis=timestamp;
                    final JSONObject data=toJson(result,intr);
                    status="Камера работает • рук: "+result.landmarks().size();
                    listener.frame(data);
                } catch (Exception e) {
                    status="Ошибка распознавания: "+e.getMessage();
                    listener.error(status);Log.w("NEON-HANDS",status,e);
                } finally {small.recycle();busy.set(false);}
            });
        } catch (Exception e) {busy.set(false);status="Ошибка кадра";listener.error(e.toString());}
        finally {img.close();}
    }

    private static JSONObject toJson(HandLandmarkerResult result,float[] intr) throws JSONException {
        JSONObject obj=new JSONObject(); JSONArray all=new JSONArray();
        if(intr!=null){JSONArray in=new JSONArray();for(float v:intr)in.put((double)v);obj.put("intr",in);}
        List<List<NormalizedLandmark>> hands=result.landmarks();
        List<List<Landmark>> world=result.worldLandmarks();
        List<List<Category>> labels=result.handedness();
        for (int i=0;i<hands.size();i++) {
            JSONArray pts=new JSONArray();
            for (NormalizedLandmark p:hands.get(i)) {
                JSONObject j=new JSONObject();j.put("x",p.x());j.put("y",p.y());j.put("z",p.z());pts.put(j);
            }
            if(pts.length()!=21)continue;
            String side=i<labels.size() && !labels.get(i).isEmpty()?labels.get(i).get(0).categoryName():(i==0?"Left":"Right");
            JSONObject h=new JSONObject();h.put("label",side);h.put("landmarks",pts);
            // metric 3D shape of the hand (meters), so the game gets real proportions and depth
            if(i<world.size()&&world.get(i).size()==21){JSONArray wp=new JSONArray();
                for(Landmark p:world.get(i)){JSONObject j=new JSONObject();j.put("x",p.x());j.put("y",p.y());j.put("z",p.z());wp.put(j);}
                h.put("world",wp);}
            all.put(h);
        }
        obj.put("hands",all);return obj;
    }

    /** Rotation is sensor-image -> screen coordinate rotation (0,90,180,270). */
    private static Bitmap toBitmap(Image image,int maxWidth,int rotation) {
        final int sw=image.getWidth(),sh=image.getHeight();
        final int scale=Math.max(1,(int)Math.ceil((double)Math.max(sw,sh)/maxWidth));
        final int w=Math.max(1,sw/scale),h=Math.max(1,sh/scale);
        int[] rgb=new int[w*h];
        Image.Plane[] planes=image.getPlanes();
        ByteBuffer y=planes[0].getBuffer(),u=planes[1].getBuffer(),v=planes[2].getBuffer();
        int yr=planes[0].getRowStride(),yp=planes[0].getPixelStride();
        int ur=planes[1].getRowStride(),up=planes[1].getPixelStride();
        int vr=planes[2].getRowStride(),vp=planes[2].getPixelStride();
        for(int j=0;j<h;j++)for(int i=0;i<w;i++){
            int sx=Math.min(sw-1,i*scale),sy=Math.min(sh-1,j*scale);
            int yy=y.get(sy*yr+sx*yp)&255;
            int uu=u.get((sy/2)*ur+(sx/2)*up)&255;
            int vv=v.get((sy/2)*vr+(sx/2)*vp)&255;
            int c=Math.max(0,yy-16),d=uu-128,e=vv-128;
            int r=(298*c+409*e+128)>>8;
            int g=(298*c-100*d-208*e+128)>>8;
            int b=(298*c+516*d+128)>>8;
            rgb[j*w+i]=0xff000000 | (clamp(r)<<16) | (clamp(g)<<8) | clamp(b);
        }
        Bitmap orig=Bitmap.createBitmap(rgb,w,h,Bitmap.Config.ARGB_8888);
        if(rotation%360==0)return orig;
        android.graphics.Matrix m=new android.graphics.Matrix();m.postRotate(rotation);
        Bitmap rotated=Bitmap.createBitmap(orig,0,0,w,h,m,true);
        orig.recycle();return rotated;
    }
    private static int clamp(int c){return Math.max(0,Math.min(255,c));}
}
