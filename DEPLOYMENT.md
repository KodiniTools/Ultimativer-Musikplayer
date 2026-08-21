# 🚀 Deployment-Anleitung für Vue.js Musikplayer

## 📋 Voraussetzungen

### Lokal (Windows):

- ✅ Node.js 16+ installiert
- ✅ npm installiert
- ✅ SSH-Client (Git Bash, PowerShell mit OpenSSH, oder PuTTY)
- ✅ Projekt in: `C:\Users\User\ultimativermusic-player-vue`

### Server:

- ✅ SSH-Zugang: `root@145.223.81.100`
- ✅ Nginx installiert
- ✅ Zielverzeichnis: `/var/www/kodinitools.com/ultimativermusikplayer`

---

## 🎯 Schnell-Deployment (Automatisch)

### Option 1: PowerShell (Windows - Empfohlen)

1. **PowerShell als Administrator öffnen**

2. **Ausführungsrichtlinie erlauben (einmalig):**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3. **Deployment-Skript ausführen:**

```powershell
cd C:\Users\User\ultimativermusic-player-vue
.\deploy.ps1
```

Das war's! Das Skript erledigt alles automatisch. ✨

---

### Option 2: Git Bash / WSL (Alternative)

1. **Git Bash öffnen**

2. **Deployment-Skript ausführen:**

```bash
cd /c/Users/User/ultimativermusic-player-vue
chmod +x deploy.sh
./deploy.sh
```

---

## 📝 Manuelles Deployment (Schritt für Schritt)

Falls du die Schritte manuell ausführen möchtest:

### Schritt 1: Projekt vorbereiten

```powershell
cd C:\Users\User\ultimativermusic-player-vue

# Dependencies installieren (falls nötig)
npm install

# Production Build erstellen
npm run build
```

Dies erstellt einen `dist` Ordner mit allen optimierten Dateien.

---

### Schritt 2: Dateien auf Server übertragen

**Option A - Mit SCP (Empfohlen):**

```powershell
scp -r dist/* root@145.223.81.100:/var/www/kodinitools.com/ultimativermusikplayer/
```

**Option B - Mit SFTP:**

```powershell
sftp root@145.223.81.100
cd /var/www/kodinitools.com/ultimativermusikplayer
put -r dist/*
exit
```

**Option C - Mit WinSCP (GUI):**

1. WinSCP öffnen
2. Verbinden: `root@145.223.81.100`
3. Navigiere zu: `/var/www/kodinitools.com/ultimativermusikplayer`
4. Ziehe `dist/*` Dateien rüber

---

### Schritt 3: Server-Berechtigungen setzen

```bash
# Auf dem Server ausführen
ssh root@145.223.81.100

cd /var/www/kodinitools.com/ultimativermusikplayer

# Berechtigungen setzen
chown -R www-data:www-data .
chmod -R 755 .
```

---

### Schritt 4: Nginx konfigurieren

**A) Bestehende Konfiguration erweitern:**

```bash
# Auf dem Server
nano /etc/nginx/sites-available/kodinitools.com
```

**Füge diesen Location-Block hinzu:**

```nginx
location /ultimativermusikplayer {
    alias /var/www/kodinitools.com/ultimativermusikplayer;
    try_files $uri $uri/ /ultimativermusikplayer/index.html;
    index index.html;

    # Caching für Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**B) Nginx neu laden:**

```bash
# Konfiguration testen
nginx -t

# Nginx neu laden
systemctl reload nginx
```

---

### Schritt 5: Testen

Öffne im Browser:

```
https://kodinitools.com/ultimativermusikplayer/
```

✅ Die Anwendung sollte jetzt laufen!

---

## 🔧 Troubleshooting

### Problem: SSH-Verbindung schlägt fehl

**Lösung:**

```powershell
# SSH-Key verwenden
ssh -i C:\Users\User\.ssh\id_rsa root@145.223.81.100

# Oder SSH-Agent nutzen
ssh-add C:\Users\User\.ssh\id_rsa
```

---

### Problem: "Permission denied" beim SCP

**Lösung:**

```bash
# Auf dem Server
mkdir -p /var/www/kodinitools.com/ultimativermusikplayer
chmod 755 /var/www/kodinitools.com/ultimativermusikplayer
```

---

### Problem: 404 Error nach Deployment

**Ursachen:**

1. Nginx-Konfiguration fehlt
2. Dateien im falschen Verzeichnis
3. Berechtigungen falsch

**Lösung:**

```bash
# Auf dem Server prüfen
ls -la /var/www/kodinitools.com/ultimativermusikplayer

# Sollte zeigen:
# index.html
# assets/
# favicon.ico
```

---

### Problem: Weiße Seite / JavaScript Errors

**Ursache:** Base-Path in Vite nicht gesetzt

**Lösung:**
Bearbeite `vite.config.js`:

```javascript
export default defineConfig({
  base: '/ultimativermusikplayer/', // Wichtig!
  plugins: [vue()],
  // ...
})
```

Dann neu bauen und deployen.

---

## 🔄 Updates deployen

Für spätere Updates einfach das Deployment-Skript erneut ausführen:

```powershell
cd C:\Users\User\ultimativermusic-player-vue
.\deploy.ps1
```

Das Skript:

1. ✅ Erstellt neuen Build
2. ✅ Überschreibt alte Dateien
3. ✅ Behält Server-Konfiguration bei

---

## 📊 Erweiterte Konfiguration

### HTTPS erzwingen (falls nicht vorhanden)

```nginx
server {
    listen 80;
    server_name kodinitools.com;
    return 301 https://$server_name$request_uri;
}
```

### GZIP Kompression aktivieren

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1024;
```

### Cache-Headers für bessere Performance

```nginx
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 📈 Performance-Optimierung

### 1. Dateigröße prüfen

```bash
cd dist
du -sh *
```

Große Dateien? → Chunk-Splitting verbessern in `vite.config.js`

### 2. Lighthouse-Score testen

1. Browser DevTools öffnen (F12)
2. "Lighthouse" Tab
3. "Generate report" für Production URL

### 3. CDN verwenden (Optional)

Für bessere globale Performance externe Assets über CDN laden.

---

## 🔐 Sicherheit

### SSH-Key Authentication (Empfohlen)

1. **SSH-Key generieren (falls nicht vorhanden):**

```powershell
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

2. **Public Key auf Server kopieren:**

```powershell
type C:\Users\User\.ssh\id_rsa.pub | ssh root@145.223.81.100 "cat >> ~/.ssh/authorized_keys"
```

3. **Testen:**

```powershell
ssh root@145.223.81.100
```

Sollte jetzt ohne Passwort funktionieren! ✅

---

## 📞 Support Checkliste

Bei Problemen folgende Infos sammeln:

- [ ] Browser-Konsole (F12) → Fehler?
- [ ] Nginx Error Log: `tail -f /var/log/nginx/error.log`
- [ ] Dateien vorhanden? `ls -la /var/www/kodinitools.com/ultimativermusikplayer`
- [ ] Nginx-Konfiguration: `nginx -t`
- [ ] Server-Logs: `journalctl -u nginx -n 50`

---

## ✅ Checkliste nach Deployment

- [ ] Seite lädt unter `https://kodinitools.com/ultimativermusikplayer/`
- [ ] Keine JavaScript-Fehler in Konsole
- [ ] Audio-Upload funktioniert
- [ ] Player-Controls funktionieren
- [ ] Theme-Wechsel funktioniert
- [ ] Sprach-Wechsel funktioniert
- [ ] Visualizer startet beim Abspielen
- [ ] Mobile Version funktioniert

---

## 🎉 Fertig!

Deine Vue.js Anwendung ist jetzt live unter:
**https://kodinitools.com/ultimativermusikplayer/**

Bei Fragen oder Problemen: Melde dich! 🚀
