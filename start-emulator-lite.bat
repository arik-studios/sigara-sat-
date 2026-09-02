@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Toptancı Satış Sistemi - Tablet Lite Emülatörü

echo ===================================================================
echo   ⚡ TOPTANCI SATIŞ SİSTEMİ - TABLET LITE EMÜLATÖRÜ
echo ===================================================================
echo.
echo [*] Emülatör sunucusu ve tablet ekranı başlatılıyor...

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [✓] Node.js motoru ile bağımsız tablet penceresi açılıyor...
    node server.js
    pause
    exit /b
)

:: Node yoksa doğrudan tarayıcı ile aç
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="%CD%\index.html" --window-size=1240,820
    goto :done
)

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="%CD%\index.html" --window-size=1240,820
    goto :done
)

start "" "%CD%\index.html"

:done
echo [✓] Emülatör başarıyla açıldı!
timeout /t 3 > nul
