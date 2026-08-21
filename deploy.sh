#!/usr/bin/env bash
set -euo pipefail

# ========================================================================
#  Ultimativer Musikplayer – Deployment
#
#  Baut das Astro-/Vue-Projekt und lädt das Ergebnis direkt in den
#  Server-Ordner /var/www/kodinitools.com/ultimativer-musikplayer.
#
#  Nutzung (im Repo-Root, auf dem main-Branch):
#      ./deploy.sh
#
#  Konfiguration lässt sich per Umgebungsvariable überschreiben, z. B.:
#      SERVER="root@example.com" ./deploy.sh
# ========================================================================

# --- Konfiguration --------------------------------------------------------
SERVER="${SERVER:-root@145.223.81.100}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/kodinitools.com/ultimativer-musikplayer}"

# In das Verzeichnis dieses Skripts wechseln (Repo-Root), plattformunabhängig.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Astro legt das Build-Ergebnis wegen `base: '/ultimativer-musikplayer'`
# bereits unter diesem Unterordner ab – das ist der Inhalt, der in den
# Server-Ordner gehört.
BUILD_DIR="dist/ultimativer-musikplayer"

echo "================================================"
echo " Ultimativer Musikplayer – Deployment"
echo "================================================"
echo " Ziel:  ${SERVER}:${REMOTE_PATH}"
echo ""

# --- Schritt 1: Dependencies -------------------------------------------------
echo "[1/4] Überprüfe Dependencies..."
if [ ! -d "node_modules" ]; then
  echo "      node_modules fehlt – installiere..."
  npm ci
fi

# --- Schritt 2: Production Build --------------------------------------------
echo "[2/4] Erstelle Production Build..."
npm run build

if [ ! -d "$BUILD_DIR" ]; then
  echo "Build-Verzeichnis '$BUILD_DIR' nicht gefunden – Build fehlgeschlagen!" >&2
  exit 1
fi
echo "      Build erfolgreich erstellt."

# --- Schritt 3: Server vorbereiten ------------------------------------------
echo "[3/4] Bereite Server-Verzeichnis vor..."
ssh "$SERVER" "mkdir -p '$REMOTE_PATH'"

# --- Schritt 4: Übertragung -------------------------------------------------
# Bevorzugt rsync (überträgt nur Änderungen und entfernt veraltete Dateien,
# damit keine alten HTML-/Asset-Reste zurückbleiben). Fällt auf scp zurück,
# falls rsync nicht verfügbar ist.
echo "[4/4] Übertrage Dateien zum Server..."
if command -v rsync >/dev/null 2>&1; then
  rsync -az --delete "$BUILD_DIR/" "${SERVER}:${REMOTE_PATH}/"
else
  echo "      rsync nicht gefunden – verwende scp (ohne Bereinigung alter Dateien)."
  # Alten Inhalt leeren, um veraltete Dateien zu entfernen, dann kopieren.
  ssh "$SERVER" "rm -rf '${REMOTE_PATH:?}/'* '${REMOTE_PATH:?}/'.[!.]* 2>/dev/null || true"
  scp -r "$BUILD_DIR/"* "${SERVER}:${REMOTE_PATH}/"
fi

echo ""
echo "================================================"
echo " Deployment erfolgreich abgeschlossen!"
echo "================================================"
echo ""
echo " Verfügbar unter:"
echo "   https://kodinitools.com/ultimativer-musikplayer/"
echo ""
