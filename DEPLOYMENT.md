# Deployment – Ultimativer Musikplayer

Die App ist ein statischer Astro-Build (Landingpage + Vue-Island für den Player).
Es läuft kein Backend.

| | |
|---|---|
| Live-URL | `https://kodinitools.com/ultimativer-musikplayer/` |
| Server-Ordner | `/var/www/kodinitools.com/ultimativer-musikplayer` |
| Build-Ordner | `dist/ultimativer-musikplayer/` |
| Deploy-Skript | `deploy.sh` (einziges Deploy-Skript) |
| nginx-Konfiguration | `nginx.conf` |

> Der frühere Pfad `/ultimativermusikplayer/` (ohne Bindestrich) wird nur noch
> per 301 auf `/ultimativer-musikplayer/` umgeleitet. Nichts mehr dorthin deployen
> und nicht mehr darauf verlinken.

## Deployen

Voraussetzungen: Node.js/npm, `ssh` und idealerweise `rsync`.
Unter Windows `deploy.sh` in **Git Bash** oder **WSL** ausführen.

```bash
# Vom Entwicklungsrechner (Build lokal, Übertragung per SSH)
./deploy.sh

# Direkt auf dem Server (Repo liegt dort)
./deploy.sh --local

# Anderer Server oder Zielordner
SERVER="root@example.com" REMOTE_PATH="/pfad" ./deploy.sh
```

Das Skript führt `npm run build` aus und synchronisiert `dist/ultimativer-musikplayer/`
mit `rsync --delete` in den Server-Ordner. Ohne `rsync` wird der Ordner geleert und
per `scp`/`cp` neu befüllt.

## nginx

Der Inhalt von `nginx.conf` gehört in den `server { … }`-Block von `kodinitools.com`.
Er enthält:

- die 301-Weiterleitung vom alten Pfad `/ultimativermusikplayer` auf den neuen,
- einen Cache-Block für die fingerprinted Assets unter `/_astro/`,
- die Haupt-Location mit SSI (Navigation, Footer, Cookie-Banner).

Im Server-Block darf **kein** alter Block `location /ultimativermusikplayer { alias … }`
mehr stehen. Er würde mit der Weiterleitung kollidieren.

```bash
nginx -t && systemctl reload nginx
```

## Prüfen

```bash
# Neue URL muss 200 liefern
curl -sI https://kodinitools.com/ultimativer-musikplayer/ | head -1

# Alte URL: genau ein 301 auf den neuen Pfad, danach 200
curl -sIL --max-redirs 10 https://kodinitools.com/ultimativermusikplayer/ | grep -iE "^HTTP|^location"

# Sitemap
curl -s https://kodinitools.com/ultimativer-musikplayer/sitemap.xml
```

Wenn die Weiterleitung korrekt funktioniert, kann ein alter Ordner
`/var/www/kodinitools.com/ultimativermusikplayer` auf dem Server gelöscht werden.
nginx liefert daraus ohnehin nichts mehr aus.
