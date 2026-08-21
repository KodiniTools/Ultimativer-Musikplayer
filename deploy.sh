#!/usr/bin/env bash
set -euo pipefail

# ========================================================================
#  Ultimativer Musikplayer – Deployment
#
#  Baut das Astro-/Vue-Projekt und legt das Ergebnis im Server-Ordner
#  /var/www/kodinitools.com/ultimativer-musikplayer ab.
#
#  Es gibt zwei Betriebsarten:
#
#  1) LOKAL (das Skript läuft direkt auf dem Server):
#         ./deploy.sh --local
#     Voraussetzung: Node.js/npm und das Repo sind auf dem Server vorhanden.
#     Der Build wird lokal in den Zielordner kopiert (kein SSH nötig).
#
#  2) REMOTE (das Skript läuft auf dem Entwicklungs-Rechner, Standard):
#         ./deploy.sh
#     Baut lokal und überträgt das Ergebnis per rsync/scp via SSH zum Server.
#
#  Konfiguration per Umgebungsvariable, z. B.:
#         SERVER="root@example.com" REMOTE_PATH="/pfad" ./deploy.sh
# ========================================================================

# --- Konfiguration --------------------------------------------------------
SERVER="${SERVER:-root@145.223.81.100}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/kodinitools.com/ultimativer-musikplayer}"

# Modus bestimmen: --local (Argument) oder LOCAL=1 (Umgebung) => lokaler Deploy.
LOCAL_DEPLOY="${LOCAL:-0}"
if [ "${1:-}" = "--local" ]; then
  LOCAL_DEPLOY=1
fi

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
if [ "$LOCAL_DEPLOY" = "1" ]; then
  echo " Modus: LOKAL"
  echo " Ziel:  ${REMOTE_PATH}"
else
  echo " Modus: REMOTE (SSH)"
  echo " Ziel:  ${SERVER}:${REMOTE_PATH}"
fi
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

# --- Schritt 3: Zielverzeichnis vorbereiten ---------------------------------
echo "[3/4] Bereite Zielverzeichnis vor..."
if [ "$LOCAL_DEPLOY" = "1" ]; then
  mkdir -p "$REMOTE_PATH"
else
  ssh "$SERVER" "mkdir -p '$REMOTE_PATH'"
fi

# --- Schritt 4: Übertragung -------------------------------------------------
# rsync --delete überträgt nur Änderungen und entfernt veraltete Dateien,
# damit keine alten HTML-/Asset-Reste zurückbleiben (wichtig für die
# fingerprinted _astro-Dateien mit immutable-Cache).
echo "[4/4] Übertrage Dateien..."
if [ "$LOCAL_DEPLOY" = "1" ]; then
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$BUILD_DIR/" "$REMOTE_PATH/"
  else
    echo "      rsync nicht gefunden – verwende cp (ohne Bereinigung alter Dateien)."
    rm -rf "${REMOTE_PATH:?}/"* "${REMOTE_PATH:?}/".[!.]* 2>/dev/null || true
    cp -a "$BUILD_DIR/." "$REMOTE_PATH/"
  fi
else
  if command -v rsync >/dev/null 2>&1; then
    rsync -az --delete "$BUILD_DIR/" "${SERVER}:${REMOTE_PATH}/"
  else
    echo "      rsync nicht gefunden – verwende scp (ohne Bereinigung alter Dateien)."
    ssh "$SERVER" "rm -rf '${REMOTE_PATH:?}/'* '${REMOTE_PATH:?}/'.[!.]* 2>/dev/null || true"
    scp -r "$BUILD_DIR/"* "${SERVER}:${REMOTE_PATH}/"
  fi
fi

echo ""
echo "================================================"
echo " Deployment erfolgreich abgeschlossen!"
echo "================================================"
echo ""
echo " Verfügbar unter:"
echo "   https://kodinitools.com/ultimativer-musikplayer/"
echo ""
