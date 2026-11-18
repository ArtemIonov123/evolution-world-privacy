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
import com.google.mediapipe.tasks.core.Delegate;
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
 * v3.5.2 hand tracking.
 * - The ARCore CPU image is only COPIED on the AR thread (fast) and closed at once;
 *   YUV->RGB conversion and MediaPipe run on a worker thread, so ARCore never stalls.
 * - Full camera resolution (up to 640 px) for more precise landmarks.
 * - MediaPipe runs on the GPU when possible (falls back to CPU).
 * - Every result carries the camera pose of ITS frame, so the game can place hands
 *   correctly even if the head moved while the frame was being processed.
 */
final class HandTracker {
    interface OnHands { void frame(JSONObject hands); void error(String problem); }

    private static final int MAX_SIDE = 1280;
    private final Context context;
    private final OnHands listener;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean busy = new AtomicBoolean(false);
    private final AtomicBoolean requested = new AtomicBoolean(false);
    private HandLandmarker landmarker;
    private volatile long lastTsMs;
    private volatile String status = "Выключено";
    private volatile String delegate = "";
    private volatile float inferMs = 0f;

    // reusable copies of the YUV planes
    private byte[] yBuf = new byte[0], uBuf = new byte[0], vBuf = new byte[0];

    HandTracker(Context context, OnHands listener) { this.context=context; this.listener=listener; }

    private HandLandmarker create(Delegate d) {
        BaseOptions base=BaseOptions.builder().setModelAssetPath("hand_landmarker.task").setDelegate(d).build();
        HandLandmarker.HandLandmarkerOptions options=HandLandmarker.HandLandmarkerOptions.builder()
            .setBaseOptions(base).setRunningMode(RunningMode.VIDEO).setNumHands(2)
            .setMinHandDetectionConfidence(.5f)
            .setMinHandPresenceConfidence(.5f)
            .setMinTrackingConfidence(.45f).build();
        return HandLandmarker.createFromOptions(context,options);
    }

    void start() {
        requested.set(true);
        status="Инициализация MediaPipe";
        worker.execute(() -> {
            if (!requested.get()) return;
            if (landmarker==null) {
                try { landmarker=create(Delegate.GPU); delegate="GPU"; }
                catch (Throwable g) {
                    Log.w("NEON-HANDS","GPU delegate unavailable, using CPU",g);
                    try { landmarker=create(Delegate.CPU); delegate="CPU"; }
                    catch (Exception e) {
                        requested.set(false);status="Ошибка модели: "+e.getMessage();
                        listener.error(status); Log.e("NEON-HANDS",status,e); return;
                    }
                }
            }
            status="Поиск рук ("+delegate+")";
        });
    }
    void stop(){requested.set(false);status="Выключено";}
    boolean wantsFrames(){return requested.get()&&landmarker!=null&&!busy.get();}
    String info(){return status;}
    void close(){requested.set(false);worker.execute(()->{if(landmarker!=null){landmarker.close();landmarker=null;}});worker.shutdown();}

    private static byte[] copyPlane(ByteBuffer b, byte[] dst){
        b.rewind(); int n=b.remaining(); if(dst.length<n)dst=new byte[n]; b.get(dst,0,n); return dst;
    }

    /** AR thread: copy the planes, close the Image, hand the rest to the worker. */
    void onCameraImage(Image img,int rotationDeg,final float[] intr,final float[] pose,final long captureNs) {
        try {
            if (!requested.get()||landmarker==null||!busy.compareAndSet(false,true)) return;
            final int w=img.getWidth(),h=img.getHeight();
            Image.Plane[] p=img.getPlanes();
            final int yr=p[0].getRowStride(),yp=p[0].getPixelStride(),ur=p[1].getRowStride(),up=p[1].getPixelStride(),vr=p[2].getRowStride(),vp=p[2].getPixelStride();
            yBuf=copyPlane(p[0].getBuffer(),yBuf);uBuf=copyPlane(p[1].getBuffer(),uBuf);vBuf=copyPlane(p[2].getBuffer(),vBuf);
            final byte[] Y=yBuf,U=uBuf,V=vBuf;
            img.close(); img=null;
            worker.execute(() -> {
                Bitmap bmp=null;
                try {
                    if (!requested.get()||landmarker==null) return;
                    long t0=SystemClock.elapsedRealtimeNanos();
                    bmp=toBitmap(Y,U,V,w,h,yr,yp,ur,up,vr,vp,rotationDeg);
                    long ts=Math.max(captureNs/1_000_000L,lastTsMs+1);lastTsMs=ts;
                    MPImage in=new BitmapImageBuilder(bmp).build();
                    HandLandmarkerResult result=landmarker.detectForVideo(in,ts);
                    long t1=SystemClock.elapsedRealtimeNanos();
                    inferMs=inferMs*.8f+(t1-t0)/1e6f*.2f;
                    JSONObject data=toJson(result,intr,pose);
                    data.put("age",(t1-captureNs)/1e6);   // ms from camera frame to now
                    status="Камера работает • рук: "+result.landmarks().size()+" • "+delegate+" "+Math.round(inferMs)+" мс";
                    listener.frame(data);
                } catch (Exception e) {
                    status="Ошибка распознавания: "+e.getMessage();
                    listener.error(status);Log.w("NEON-HANDS",status,e);
                } finally { if(bmp!=null)bmp.recycle(); busy.set(false); }
            });
        } catch (Exception e) {busy.set(false);status="Ошибка кадра";listener.error(e.toString());}
        finally {if(img!=null)img.close();}
    }

    private static JSONObject toJson(HandLandmarkerResult result,float[] intr,float[] pose) throws JSONException {
        JSONObject obj=new JSONObject(); JSONArray all=new JSONArray();
        if(intr!=null){JSONArray in=new JSONArray();for(float v:intr)in.put((double)v);obj.put("intr",in);}
        if(pose!=null){JSONArray pa=new JSONArray();for(float v:pose)pa.put((double)v);obj.put("pose",pa);}
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
            float score=i<labels.size() && !labels.get(i).isEmpty()?labels.get(i).get(0).score():1f;
            JSONObject h=new JSONObject();h.put("label",side);h.put("score",(double)score);h.put("landmarks",pts);
            if(i<world.size()&&world.get(i).size()==21){JSONArray wp=new JSONArray();
                for(Landmark p:world.get(i)){JSONObject j=new JSONObject();j.put("x",p.x());j.put("y",p.y());j.put("z",p.z());wp.put(j);}
                h.put("world",wp);}
            all.put(h);
        }
        obj.put("hands",all);return obj;
    }

    /** YUV_420_888 -> ARGB, box-filtered down to MAX_SIDE, then rotated to the screen orientation. */
    private static Bitmap toBitmap(byte[] Y,byte[] U,byte[] V,int sw,int sh,int yr,int yp,int ur,int up,int vr,int vp,int rotation) {
        final int scale=Math.max(1,(int)Math.ceil((double)Math.max(sw,sh)/MAX_SIDE));
        final int w=Math.max(1,sw/scale),h=Math.max(1,sh/scale);
        int[] rgb=new int[w*h];
        for(int j=0;j<h;j++){
            int sy=j*scale;
            for(int i=0;i<w;i++){
                int sx=i*scale,yy;
                if(scale==1) yy=Y[sy*yr+sx*yp]&255;
                else { // average luma of the block: less aliasing, steadier landmarks
                    int acc=0;for(int dy=0;dy<scale;dy++)for(int dx=0;dx<scale;dx++)acc+=Y[(sy+dy)*yr+(sx+dx)*yp]&255;yy=acc/(scale*scale);
                }
                int ui=(sy>>1)*ur+(sx>>1)*up,vi=(sy>>1)*vr+(sx>>1)*vp;
                int uu=(ui<U.length?U[ui]:-128)&255, vv=(vi<V.length?V[vi]:-128)&255;
                int c=Math.max(0,yy-16),d=uu-128,e=vv-128;
                int r=(298*c+409*e+128)>>8, g=(298*c-100*d-208*e+128)>>8, b=(298*c+516*d+128)>>8;
                rgb[j*w+i]=0xff000000|(clamp(r)<<16)|(clamp(g)<<8)|clamp(b);
            }
        }
        Bitmap orig=Bitmap.createBitmap(rgb,w,h,Bitmap.Config.ARGB_8888);
        if(rotation%360==0)return orig;
        android.graphics.Matrix m=new android.graphics.Matrix();m.postRotate(rotation);
        Bitmap rotated=Bitmap.createBitmap(orig,0,0,w,h,m,true);
        orig.recycle();return rotated;
    }
    private static int clamp(int c){return Math.max(0,Math.min(255,c));}
}
