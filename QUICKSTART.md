# 🚀 Schnellstart-Anleitung

## Installation in 3 Schritten

### 1. Projekt vorbereiten

```bash
cd music-player-vue
npm install
```

### 2. Entwicklungsserver starten

```bash
npm run dev
```

### 3. Im Browser öffnen

Öffnen Sie: `http://localhost:5173`

## 📝 Wichtige Befehle

```bash
# Entwicklung starten
npm run dev

# Für Produktion bauen
npm run build

# Produktions-Build testen
npm run preview
```

## 🎵 Erste Schritte

1. **Audio-Dateien laden**: Klicken Sie auf "Audio auswählen" und wählen Sie MP3, WAV, FLAC oder andere Audio-Dateien
2. **Abspielen**: Klicken Sie auf den Play-Button oder direkt auf einen Titel in der Playlist
3. **Visualizer genießen**: Der Visualizer startet automatisch beim Abspielen
4. **Modi testen**: Probieren Sie die 7 verschiedenen Visualizer-Modi aus
5. **Theme wechseln**: Nutzen Sie den Mond/Sonne-Button für Dark/Light Mode
6. **Sprache ändern**: Wechseln Sie zwischen DE und EN

## 🎨 Features ausprobieren

### Playlist-Funktionen

- ✅ Mehrere Dateien auf einmal hochladen
- ✅ Shuffle aktivieren für zufällige Wiedergabe
- ✅ Loop aktivieren für Endlos-Wiedergabe
- ✅ Einzelne Titel löschen (Papierkorb-Icon)
- ✅ Playlist leeren (Löschen-Button)

### Visualizer-Modi

1. **Ribbon**: Dynamisches Band um einen Kreis
2. **Waves**: Wellenförmige Darstellung
3. **Nebula**: Partikel-Nebel-Effekt
4. **Spectrum**: Spektrum-Strahlen vom Zentrum
5. **Orbits**: Rotierende Ringe
6. **Starfield**: Sternenfeld-Animation
7. **Grid**: Pulsierendes Gitter

### Intensität anpassen

- Bewegen Sie den Intensitäts-Slider
- Niedrige Werte = subtile Animation
- Hohe Werte = intensive Visualisierung

## 🔧 Anpassungen

### Farben ändern

Bearbeiten Sie `src/assets/styles/main.css`:

```css
:root {
  --primary: #00d4ff; /* Hauptfarbe */
  --primary-2: #ff007c; /* Akzentfarbe 1 */
  --primary-3: #7c3aed; /* Akzentfarbe 2 */
}
```

### Standard-Sprache ändern

Bearbeiten Sie `src/i18n/index.js`:

```javascript
const savedLanguage = localStorage.getItem('musicplayer_language') || 'en' // Ändern Sie 'de' zu 'en'
```

### Standard-Theme ändern

Bearbeiten Sie `src/composables/useTheme.js`:

```javascript
const saved = localStorage.getItem('theme') || 'dark' // Ändern Sie 'light' zu 'dark'
```

## 📱 Mobile Nutzung

Die Anwendung ist vollständig responsiv:

- Touch-Bedienung unterstützt
- Optimiertes Layout für kleine Bildschirme
- Alle Funktionen verfügbar

## ⚡ Performance-Tipps

1. **Browser**: Nutzen Sie moderne Browser (Chrome, Firefox, Safari, Edge)
2. **Dateigröße**: Bei sehr großen Audio-Dateien kann das Laden etwas dauern
3. **Playlist**: Sehr große Playlists (>100 Titel) können die Performance beeinflussen
4. **Visualizer**: Bei Performance-Problemen reduzieren Sie die Intensität

## 🐛 Häufige Probleme

### "Cannot find module..."

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port bereits belegt

```bash
# Vite nutzt standardmäßig Port 5173
# Ändern Sie den Port in vite.config.js:
server: {
  port: 3000
}
```

### Styles werden nicht angewendet

```bash
# Löschen Sie den Vite Cache
rm -rf node_modules/.vite
npm run dev
```

## 📚 Weiterführende Dokumentation

- [Vue.js Dokumentation](https://vuejs.org/)
- [Pinia Dokumentation](https://pinia.vuejs.org/)
- [Vue I18n Dokumentation](https://vue-i18n.intlify.dev/)
- [Vite Dokumentation](https://vitejs.dev/)

## 💡 Entwicklungs-Tipps

### Vue DevTools installieren

Installieren Sie die Vue DevTools Browser-Extension für besseres Debugging:

- [Chrome](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

### Hot Module Replacement (HMR)

Änderungen werden automatisch im Browser aktualisiert - kein Reload nötig!

### Komponenten testen

1. Öffnen Sie die Vue DevTools
2. Navigieren Sie zum Components-Tab
3. Untersuchen Sie Props, Data und Events

---

Viel Spaß mit dem Ultimativen Musikplayer! 🎵

**KodiniTools** © 2024
