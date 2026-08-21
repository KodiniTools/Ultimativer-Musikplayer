# ⚡ SCHNELL-DEPLOYMENT IN 3 SCHRITTEN

## Vorbereitung (Einmalig)

### 1. Kopiere diese Dateien in dein Projekt:

```
C:\Users\User\ultimativermusic-player-vue\
├── deploy.ps1          (Deployment-Skript)
├── deploy.sh           (Alternative für Git Bash)
└── nginx-config.conf   (Nginx-Konfiguration)
```

---

## 🚀 DEPLOYMENT

### Schritt 1: PowerShell öffnen (Als Administrator)

```powershell
# Wechsle ins Projektverzeichnis
cd C:\Users\User\ultimativermusic-player-vue
```

### Schritt 2: Ausführungsrichtlinie erlauben (Nur beim ersten Mal)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Schritt 3: Deployment starten

```powershell
.\deploy.ps1
```

**Das war's!** ✨

Das Skript macht automatisch:

- ✅ Build erstellen (`npm run build`)
- ✅ Dateien auf Server kopieren
- ✅ Fertig!

---

## 📱 ALTERNATIVE: Mit Git Bash

```bash
cd /c/Users/User/ultimativermusic-player-vue
chmod +x deploy.sh
./deploy.sh
```

---

## 🔧 NACH DEM ERSTEN DEPLOYMENT

### Nginx-Konfiguration hinzufügen (Nur einmal nötig):

**Auf dem Server ausführen:**

```bash
ssh root@145.223.81.100

# Nginx-Konfiguration bearbeiten
nano /etc/nginx/sites-available/kodinitools.com
```

**Diesen Block hinzufügen:**

```nginx
location /ultimativermusikplayer {
    alias /var/www/kodinitools.com/ultimativermusikplayer;
    try_files $uri $uri/ /ultimativermusikplayer/index.html;
    index index.html;
}
```

**Nginx neu laden:**

```bash
nginx -t
systemctl reload nginx
```

---

## ✅ TESTEN

Öffne im Browser:

```
https://kodinitools.com/ultimativermusikplayer/
```

---

## 🔄 UPDATES DEPLOYEN

Für spätere Updates einfach erneut ausführen:

```powershell
cd C:\Users\User\ultimativermusic-player-vue
.\deploy.ps1
```

Fertig! 🎉

---

## ❓ PROBLEME?

### "Ausführung von Skripten ist deaktiviert"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "SSH Verbindung fehlgeschlagen"

- Überprüfe ob SSH-Key konfiguriert ist
- Teste Verbindung: `ssh root@145.223.81.100`

### "404 Not Found" nach Deployment

- Nginx-Konfiguration wurde noch nicht hinzugefügt
- Siehe Abschnitt "NACH DEM ERSTEN DEPLOYMENT"

### "Weiße Seite"

- Browser-Konsole öffnen (F12) → Fehler prüfen
- `vite.config.js` sollte `base: '/ultimativermusikplayer/'` enthalten

---

## 📞 HILFE

Vollständige Anleitung: Siehe `DEPLOYMENT.md`

---

**Viel Erfolg! 🚀**
