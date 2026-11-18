from pathlib import Path
from xml.etree import ElementTree as ET
import re
r=Path(__file__).resolve().parent.parent
j=(r/'app/src/main/java/io/github/neonblocks/hands/MainActivity.java').read_text()
h=(r/'app/src/main/java/io/github/neonblocks/hands/HandTracker.java').read_text()
s=(r/'app/src/main/assets/index.html').read_text()
ET.parse(r/'app/src/main/AndroidManifest.xml')
for method in ['start','stop','pose','info','startHands','stopHands','handsInfo']:
    assert re.search(r'@JavascriptInterface\s+public\s+\w+\s+'+method+r'\s*\(',j),method
for x in ['acquireCameraImage()', 's.update()', 'HandTracker','new Session(this)','onNativeHandLandmarks']:
    assert x in j,x
for x in ['HandLandmarker.createFromOptions','detectForVideo','Image.Plane[]','img.close()','pts.length()','result.handedness()']:
    assert x in h,x
for x in ['window.onNativeHandLandmarks','drawVoxelHands','startHandVision','renderVR','handVisionTick']:
    assert x in s,x
print('PASS: manifest, NativeAR bridge, ARCore frame extraction, MediaPipe, HTML callback, VR hand rig')
