#!/bin/bash

# ========================================
# Vue.js Musikplayer - Deployment Script
# ========================================

SERVER="root@145.223.81.100"
REMOTE_PATH="/var/www/kodinitools.com/ultimativermusikplayer"
LOCAL_PATH="C:/Users/User/ultimativermusic-player-vue"

echo "================================================"
echo "Vue.js Musikplayer - Deployment"
echo "================================================"
echo ""

# Schritt 1: In das Projekt-Verzeichnis wechseln
echo "[1/5] Wechsle in Projekt-Verzeichnis..."
cd "$LOCAL_PATH" || exit 1

# Schritt 2: Dependencies installieren (falls nötig)
echo "[2/5] Überprüfe Dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Schritt 3: Production Build erstellen
echo "[3/5] Erstelle Production Build..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build fehlgeschlagen!"
    exit 1
fi

echo "Build erfolgreich erstellt!"

# Schritt 4: Verzeichnis auf Server erstellen (falls nicht vorhanden)
echo "[4/5] Bereite Server vor..."
ssh $SERVER "mkdir -p $REMOTE_PATH"

# Schritt 5: Dateien zum Server übertragen
echo "[5/5] Übertrage Dateien zum Server..."
scp -r dist/* ${SERVER}:${REMOTE_PATH}/

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "Deployment erfolgreich abgeschlossen!"
    echo "================================================"
    echo ""
    echo "Die Anwendung ist jetzt verfügbar unter:"
    echo "https://kodinitools.com/ultimativermusikplayer/"
    echo ""
else
    echo ""
    echo "Deployment fehlgeschlagen!"
    echo "Bitte überprüfe die SSH-Verbindung und Berechtigungen."
    exit 1
fi
