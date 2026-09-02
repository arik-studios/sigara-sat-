@echo off
chcp 65001 > nul
title Toptancı Satış Sistemi - Pixel 8 Android Emülatör Başlatıcı

echo ===================================================================
echo   📱 TOPTANCI SATIŞ SİSTEMİ - PIXEL 8 / TABLET EMÜLATÖRÜ
echo ===================================================================
echo.

set EMULATOR_PATH=""

if exist "%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe" (
    set EMULATOR_PATH="%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe"
) else if exist "%ANDROID_HOME%\emulator\emulator.exe" (
    set EMULATOR_PATH="%ANDROID_HOME%\emulator\emulator.exe"
) else if exist "%ANDROID_SDK_ROOT%\emulator\emulator.exe" (
    set EMULATOR_PATH="%ANDROID_SDK_ROOT%\emulator\emulator.exe"
)

if %EMULATOR_PATH%=="" (
    echo [!] Android SDK Emulator bulunamadı.
    echo [i] Android Studio üzerinden bir Pixel 8 / Tablet AVD cihazı oluşturabilirsiniz.
    echo.
    echo [*] Alternatif olarak 'start-emulator-lite.bat' dosyasını çalıştırarak kasmayan
    echo     hızlı Tablet Lite simülatörünü anında başlatabilirsiniz.
    echo.
    pause
    exit /b
)

echo [✓] Android Emülatör Motoru Tespit Edildi: %EMULATOR_PATH%
echo [*] Mevcut AVD Cihazları listeleniyor:
%EMULATOR_PATH% -list-avds
echo.

echo [*] Pixel 8 / Tablet Emülatörü başlatılıyor...
%EMULATOR_PATH% -avd Pixel_8 -gpu host -no-boot-anim || %EMULATOR_PATH% -avd Pixel_8_Pro || %EMULATOR_PATH% -list-avds

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] 'Pixel_8' isimli bir AVD bulunamadı.
    echo [i] Lütfen Android Studio Device Manager üzerinden 'Pixel 8' veya 'Pixel Tablet' oluşturun.
    echo [*] Veya 'start-emulator-lite.bat' dosyasını çift tıklayarak anında çalıştırabilirsiniz.
    pause
)
