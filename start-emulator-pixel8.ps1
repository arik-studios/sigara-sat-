# Toptancı Satış Sistemi - Pixel 8 Android Emülatör Başlatıcı (PowerShell)
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  📱 TOPTANCI SATIŞ SİSTEMİ - PIXEL 8 / TABLET EMÜLATÖRÜ" -ForegroundColor Yellow
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$possiblePaths = @(
    "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe",
    "$env:ANDROID_HOME\emulator\emulator.exe",
    "$env:ANDROID_SDK_ROOT\emulator\emulator.exe"
)

$emulatorPath = $possiblePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $emulatorPath) {
    Write-Host "[!] Android SDK Emulator bulunamadı." -ForegroundColor Red
    Write-Host "[i] Android Studio Device Manager üzerinden bir Pixel 8 veya Tablet AVD cihazı oluşturabilirsiniz." -ForegroundColor Gray
    Write-Host "[*] Alternatif olarak 'start-emulator-lite.bat' dosyasını çalıştırarak kasmayan hızlı simülatörü anında açabilirsiniz." -ForegroundColor Green
    Read-Host "Devam etmek için Enter'a basın..."
    exit
}

Write-Host "[✓] Android Emülatör Motoru Bulundu: $emulatorPath" -ForegroundColor Green
Write-Host "[*] Mevcut AVD Cihazları:" -ForegroundColor Cyan
& $emulatorPath -list-avds

Write-Host ""
Write-Host "[*] Pixel 8 Emülatörü başlatılıyor..." -ForegroundColor Yellow
& $emulatorPath -avd Pixel_8 -gpu host -no-boot-anim
