# Ultimativer Musikplayer - Vue.js Version

Eine moderne Vue.js-Anwendung für einen professionellen Audio-Player mit Visualisierung.

## 🎵 Features

- **Audio-Visualisierung**: 7 verschiedene Visualizer-Modi (Ribbon, Waves, Nebula, Spectrum, Orbits, Starfield, Grid)
- **Playlist-Management**: Drag & Drop, Shuffle, Loop, Vor/Zurück Navigation
- **Umfassendes Format-Support**: MP3, WAV, FLAC, M4A, OGG und weitere
- **Responsive Design**: Perfekt auf Desktop, Tablet und Smartphone
- **Dark/Light Theme**: Anpassbar an Ihre Präferenzen
- **Mehrsprachigkeit**: Deutsch und Englisch
- **Kostenlos & Open Source**: Keine Registrierung erforderlich

## 🚀 Installation

### Voraussetzungen

- Node.js (Version 16 oder höher)
- npm oder yarn

### Schritte

1. **Abhängigkeiten installieren:**
```bash
npm install
```

2. **Entwicklungsserver starten:**
```bash
npm run dev
```

3. **Für Produktion bauen:**
```bash
npm run build
```

4. **Produktions-Build testen:**
```bash
npm run preview
```

## 📁 Projektstruktur

```
music-player-vue/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css          # Globale Styles
│   ├── components/
│   │   ├── AppHeader.vue         # Header mit Theme & Sprache
│   │   ├── NavigationTabs.vue    # Navigation
│   │   ├── ContentSection.vue    # Inhaltsbereich
│   │   ├── AudioUploader.vue     # Datei-Upload
│   │   ├── AudioVisualizer.vue   # Canvas-Visualisierung
│   │   ├── VisualizerControls.vue# Visualizer-Einstellungen
│   │   ├── ProgressBar.vue       # Fortschrittsbalken
│   │   ├── VolumeControl.vue     # Lautstärke-Steuerung
│   │   ├── PlayerControls.vue    # Play/Pause/Stop etc.
│   │   ├── Playlist.vue          # Playlist-Anzeige
│   │   ├── FAQSection.vue        # FAQ-Bereich
│   │   └── CookieBanner.vue      # Cookie-Hinweis
│   ├── composables/
│   │   ├── useAudioPlayer.js     # Audio-Logik
│   │   ├── useVisualizer.js      # Visualisierungs-Logik
│   │   └── useTheme.js           # Theme-Verwaltung
│   ├── i18n/
│   │   ├── index.js              # I18n-Konfiguration
│   │   └── locales/
│   │       ├── de.js             # Deutsche Übersetzungen
│   │       └── en.js             # Englische Übersetzungen
│   ├── stores/
│   │   └── playerStore.js        # Pinia Store
│   ├── App.vue                   # Haupt-Komponente
│   └── main.js                   # App-Einstiegspunkt
├── public/                       # Statische Assets
├── index.html                    # HTML-Template
├── package.json                  # Dependencies
├── vite.config.js               # Vite-Konfiguration
└── README.md                     # Diese Datei
```

## 🎨 Architektur

### Vue 3 Composition API
Die Anwendung nutzt die moderne Composition API für bessere Code-Organisation und Wiederverwendbarkeit.

### Pinia State Management
Alle Player-Stati werden zentral in einem Pinia Store verwaltet:
- Audio-Dateien und Playlist
- Aktueller Wiedergabe-Status
- Loop/Shuffle-Einstellungen
- Visualizer-Konfiguration

### Composables
Wiederverwendbare Logik ist in Composables gekapselt:
- **useAudioPlayer**: Web Audio API, Playback-Steuerung
- **useVisualizer**: Canvas-Rendering und Animationen
- **useTheme**: Dark/Light Mode Verwaltung

### Vue I18n
Mehrsprachigkeit wird über Vue I18n realisiert mit:
- Deutsch (Standard)
- Englisch
- LocalStorage-Persistierung

## 🎯 Verwendung

### Audio-Dateien laden
1. Klicken Sie auf "Audio auswählen"
2. Wählen Sie eine oder mehrere Audiodateien aus
3. Die Dateien werden automatisch zur Playlist hinzugefügt

### Visualisierung anpassen
- **Modus**: Wählen Sie zwischen 7 verschiedenen Visualizer-Modi
- **Intensität**: Passen Sie die Intensität der Visualisierung an

### Playlist-Verwaltung
- Klicken Sie auf einen Titel, um ihn abzuspielen
- Nutzen Sie das Papierkorb-Icon zum Löschen einzelner Titel
- "Löschen"-Button leert die komplette Playlist

### Keyboard-Shortcuts
- **Leertaste**: Play/Pause
- **Pfeil rechts/links**: Im Progress-Bar spulen

## 🔧 Anpassungen

### Theme anpassen
Bearbeiten Sie die CSS-Variablen in `src/assets/styles/main.css`:

```css
:root {
  --primary: #00d4ff;
  --primary-2: #ff007c;
  /* ... weitere Farben */
}
```

### Neue Sprache hinzufügen
1. Erstellen Sie eine neue Datei in `src/i18n/locales/` (z.B. `fr.js`)
2. Fügen Sie die Sprache in `src/i18n/index.js` hinzu
3. Erweitern Sie den Language-Switcher in `AppHeader.vue`

### Neuen Visualizer-Modus hinzufügen
1. Fügen Sie die draw-Funktion in `useVisualizer.js` hinzu
2. Erweitern Sie den Switch-Case in der `draw()`-Methode
3. Fügen Sie die Option in `VisualizerControls.vue` hinzu

## 📦 Dependencies

### Production
- **vue**: ^3.4.0 - Vue.js Framework
- **pinia**: ^2.1.7 - State Management
- **vue-i18n**: ^9.9.0 - Internationalisierung

### Development
- **@vitejs/plugin-vue**: ^5.0.0 - Vite Vue Plugin
- **vite**: ^5.0.0 - Build Tool

## 🌐 Browser-Kompatibilität

- Chrome/Edge: ✅ Vollständig unterstützt
- Firefox: ✅ Vollständig unterstützt
- Safari: ✅ Vollständig unterstützt
- Opera: ✅ Vollständig unterstützt

## 📝 Lizenz

Open Source - Frei verwendbar

## 👨‍💻 Entwicklung

### Code-Struktur
- **Komponenten**: Single File Components (.vue)
- **Styling**: Scoped CSS + Globale Styles
- **State**: Pinia Store (Composition API)
- **Reactivity**: Vue 3 Composition API

### Best Practices
- Komponenten sind klein und fokussiert
- Logik ist in Composables ausgelagert
- Props und Emits sind klar definiert
- Accessibility (ARIA-Labels, Keyboard-Support)

## 🐛 Troubleshooting

### Audio spielt nicht ab
- Prüfen Sie, ob das Audio-Format vom Browser unterstützt wird
- Stellen Sie sicher, dass der Browser Autoplay erlaubt

### Visualizer wird nicht angezeigt
- Der Visualizer startet erst beim Abspielen
- Prüfen Sie die Browser-Console auf Fehler

### Styles werden nicht angewendet
- Führen Sie `npm install` erneut aus
- Löschen Sie den `node_modules` Ordner und installieren Sie neu

## 📞 Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue auf GitHub oder kontaktieren Sie uns über die Website.

---

**KodiniTools** - Ultimativer Musikplayer © 2024
