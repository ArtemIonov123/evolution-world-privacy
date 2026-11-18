#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
command -v gradle >/dev/null || { echo 'Install Gradle 8.9 / Android Studio + Android SDK before building.'; exit 1; }
gradle --no-daemon :app:assembleDebug
cp app/build/outputs/apk/debug/app-debug.apk NEON_BLOCK_WORLD_AR_VR_v3.4.7_REAL_HANDS_TEST.apk
echo "APK ready: $(pwd)/NEON_BLOCK_WORLD_AR_VR_v3.4.7_REAL_HANDS_TEST.apk"
