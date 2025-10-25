# ========================================
# Vue.js Musikplayer - Deployment Script
# ========================================

$SERVER = "root@145.223.81.100"
$REMOTE_PATH = "/var/www/kodinitools.com/ultimativermusikplayer"
$LOCAL_PATH = "C:\Users\User\ultimativermusic-player-vue"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Vue.js Musikplayer - Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Schritt 1: In das Projekt-Verzeichnis wechseln
Write-Host "[1/5] Wechsle in Projekt-Verzeichnis..." -ForegroundColor Yellow
Set-Location $LOCAL_PATH

# Schritt 2: Dependencies installieren (falls nötig)
Write-Host "[2/5] Überprüfe Dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Green
    npm install
}

# Schritt 3: Production Build erstellen
Write-Host "[3/5] Erstelle Production Build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

Write-Host "Build erfolgreich erstellt!" -ForegroundColor Green

# Schritt 4: Verzeichnis auf Server erstellen (falls nicht vorhanden)
Write-Host "[4/5] Bereite Server vor..." -ForegroundColor Yellow
ssh $SERVER "mkdir -p $REMOTE_PATH"

# Schritt 5: Dateien zum Server übertragen
Write-Host "[5/5] Übertrage Dateien zum Server..." -ForegroundColor Yellow
scp -r dist/* ${SERVER}:${REMOTE_PATH}/

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "Deployment erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Die Anwendung ist jetzt verfügbar unter:" -ForegroundColor Cyan
    Write-Host "https://kodinitools.com/ultimativermusikplayer/" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Deployment fehlgeschlagen!" -ForegroundColor Red
    Write-Host "Bitte überprüfe die SSH-Verbindung und Berechtigungen." -ForegroundColor Red
    exit 1
}
