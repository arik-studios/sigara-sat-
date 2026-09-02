# Toptancı Satış Sistemi - Tablet Lite Emülatör Başlatıcı (PowerShell)
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  ⚡ TOPTANCI SATIŞ SİSTEMİ - TABLET LITE EMÜLATÖRÜ" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }
Set-Location $scriptDir

$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue

if ($nodeInstalled) {
    Write-Host "[✓] Node.js ile donanım hızlandırmalı tablet penceresi açılıyor..." -ForegroundColor Green
    & node server.js
} else {
    $indexPath = Join-Path $scriptDir "index.html"
    $chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    $edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

    if (Test-Path $chrome) {
        Start-Process $chrome -ArgumentList "--app=`"$indexPath`"", "--window-size=1240,820"
    } elseif (Test-Path $edge) {
        Start-Process $edge -ArgumentList "--app=`"$indexPath`"", "--window-size=1240,820"
    } else {
        Start-Process $indexPath
    }
    Write-Host "[✓] Emülatör açıldı!" -ForegroundColor Green
}
