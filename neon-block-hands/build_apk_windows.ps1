# Builds a real APK on a Windows machine with Android Studio SDK.
$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$gradle = Get-Command gradle -ErrorAction SilentlyContinue
if(-not $env:ANDROID_HOME -and (Test-Path "$env:LOCALAPPDATA\Android\Sdk")) {
    $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}
if(-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) {
    throw 'Установите Android Studio и Android SDK. Нужна переменная ANDROID_HOME.'
}
if(Test-Path '.\gradlew.bat') {
    $gradleCommand = (Join-Path $PSScriptRoot 'gradlew.bat')
} elseif($gradle) {
    $gradleCommand = $gradle.Source
} else {
    # Bootstrap Gradle 8.9 into the project directory; does not modify PATH.
    $folder = Join-Path $PSScriptRoot '.gradle-local'
    $bin = Join-Path $folder 'gradle-8.9\bin\gradle.bat'
    if(-not (Test-Path $bin)) {
        New-Item -ItemType Directory -Force -Path $folder | Out-Null
        $zip = Join-Path $folder 'gradle-8.9-bin.zip'
        Write-Host 'Скачиваю Gradle 8.9 (один раз)...'
        Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.9-bin.zip' -OutFile $zip
        Expand-Archive -Path $zip -DestinationPath $folder -Force
    }
    $gradleCommand = $bin
}
Write-Host 'Сборка NEON BLOCK WORLD Hand Tracking APK...'
& $gradleCommand --no-daemon :app:assembleDebug
if($LASTEXITCODE -ne 0) { throw 'Ошибка сборки Gradle; смотрите сообщения выше' }
$from = Join-Path $PSScriptRoot 'app\build\outputs\apk\debug\app-debug.apk'
$to = Join-Path $PSScriptRoot 'NEON_BLOCK_WORLD_AR_VR_v3.4.7_REAL_HANDS_TEST.apk'
Copy-Item -Path $from -Destination $to -Force
Write-Host "APK: $to"
