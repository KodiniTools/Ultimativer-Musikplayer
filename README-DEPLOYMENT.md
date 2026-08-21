# 🚀 Vue.js Musikplayer - Deployment Package

## 📦 Was ist enthalten?

Dieses Paket enthält alles für das Deployment auf deinen Server:

```
📁 music-player-vue/          → Vue.js Anwendung (vollständig)
📄 deploy.ps1                  → PowerShell Deployment-Skript (Windows)
📄 deploy.sh                   → Bash Deployment-Skript (Linux/Mac)
📄 nginx-config.conf           → Nginx Server-Konfiguration
📄 DEPLOYMENT.md               → Vollständige Deployment-Dokumentation
📄 QUICK-DEPLOY.md             → Schnellstart-Anleitung
📄 PROJEKT-ÜBERSICHT.md        → Projekt-Dokumentation
```

---

## ⚡ SCHNELLSTART

### 1️⃣ Entpacke das ZIP nach:

```
C:\Users\User\ultimativermusic-player-vue
```

### 2️⃣ PowerShell öffnen (Als Administrator)

```powershell
cd C:\Users\User\ultimativermusic-player-vue
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3️⃣ Deployment starten

```powershell
.\deploy.ps1
```

**Fertig!** Die Anwendung ist jetzt auf dem Server. ✨

---

## 📋 Server-Informationen

- **SSH:** `root@145.223.81.100`
- **Ziel:** `/var/www/kodinitools.com/ultimativermusikplayer`
- **URL:** `https://kodinitools.com/ultimativermusikplayer/`

---

## 📚 Dokumentation

### Für Eilige:

➡️ **QUICK-DEPLOY.md** - 3-Schritte Schnellstart

### Für Detaillierte Infos:

➡️ **DEPLOYMENT.md** - Vollständige Anleitung mit Troubleshooting

### Für Entwickler:

➡️ **README.md** (in music-player-vue/) - Projekt-Dokumentation
➡️ **PROJEKT-ÜBERSICHT.md** - Architektur und Features

---

## 🔧 Was die Skripte tun

Das Deployment-Skript (`deploy.ps1` oder `deploy.sh`):

1. ✅ Wechselt ins Projekt-Verzeichnis
2. ✅ Installiert Dependencies (falls nötig)
3. ✅ Erstellt Production Build (`npm run build`)
4. ✅ Erstellt Verzeichnis auf Server (falls nicht vorhanden)
5. ✅ Kopiert alle Dateien zum Server via SCP
6. ✅ Zeigt Erfolgs-/Fehlermeldung

**Dauer:** ~1-2 Minuten (abhängig von Internetgeschwindigkeit)

---

## 🎯 Nach dem ersten Deployment

### Nginx konfigurieren (Einmalig):

```bash
# Auf dem Server einloggen
ssh root@145.223.81.100

# Nginx-Konfiguration bearbeiten
nano /etc/nginx/sites-available/kodinitools.com
```

**Inhalt aus `nginx-config.conf` einfügen**

```bash
# Konfiguration testen
nginx -t

# Nginx neu laden
systemctl reload nginx
```

---

## ✅ Testen

Nach dem Deployment öffne:

```
https://kodinitools.com/ultimativermusikplayer/
```

Du solltest sehen:

- ✅ Moderner Musikplayer mit Theme-Switcher
- ✅ Audio-Upload-Button
- ✅ Visualizer (schwarzes Quadrat)
- ✅ Player-Controls
- ✅ Playlist-Bereich

---

## 🔄 Updates deployen

Für spätere Updates:

```powershell
cd C:\Users\User\ultimativermusic-player-vue
.\deploy.ps1
```

Das Skript überschreibt die alten Dateien automatisch. ✨

---

## ❓ Häufige Probleme

### "Ausführung von Skripten ist deaktiviert"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "SSH Verbindung fehlgeschlagen"

- Prüfe SSH-Zugang: `ssh root@145.223.81.100`
- Passwort oder SSH-Key korrekt?

### "404 Not Found" nach Deployment

- Nginx-Konfiguration wurde noch nicht hinzugefügt
- Siehe "Nach dem ersten Deployment"

### "Weiße Seite / JavaScript Errors"

- Browser-Konsole öffnen (F12)
- Fehler prüfen und melden

---

## 📞 Support

Bei Problemen siehe:

- **DEPLOYMENT.md** → Troubleshooting-Sektion
- **QUICK-DEPLOY.md** → Häufige Probleme

---

## 🎉 Alles klar?

**Dann kann es losgehen!**

1. Entpacken
2. `.\deploy.ps1` ausführen
3. Nginx konfigurieren
4. Fertig! 🚀

Die Anwendung ist dann live unter:
**https://kodinitools.com/ultimativermusikplayer/**

---

**Viel Erfolg mit dem Deployment!** 🎵
