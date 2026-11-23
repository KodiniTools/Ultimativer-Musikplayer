# Design-System · Tokens v2

Design-Tokens des Ultimativen Musikplayers. Sie sind eine Kopie der v2-Tokens aus dem Collage Maker
(`KodiniTools/Collage-Maker`, `src/design-system/`, Stand `9dc4eca`), die dort wiederum aus dem
Playlist Generator stammen (Stand `89bb48e`). So teilen die Apps auf kodinitools.com Palette,
Radien, Schrift und Bewegung. Werte werden im Playlist Generator gepflegt und hierher übernommen;
`__tests__/tokens-v2.spec.ts` hält JSON und CSS konsistent und prüft den Kontrast (WCAG AA).

## Dateien

| Datei                         | Zweck                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `tokens-v2.css`               | **Laufzeit-Quelle.** CSS Custom Properties `--ds-*`, Dark auf `:root`, Light auf `.light-theme` und `:root[data-theme='light']`. |
| `tokens-v2.json`              | Maschinenlesbare Fassung (W3C-Design-Tokens-nah), `$extensions.css` nennt die Variable.                                          |
| `tokens-v2.ts`                | Typisierter Zugriff, z. B. `themeColorsV2('light').surface0` für `meta[theme-color]`.                                            |
| `__tests__/tokens-v2.spec.ts` | Konsistenz JSON ↔ CSS, Light-Spiegelung, Namespace, Einbindung in `main.css`, Kontrast-Audit.                                    |
| `__tests__/tokenTestUtils.ts` | CSS-Block-Parser, Token-Walker, Kontrastberechnung.                                                                              |

`src/assets/styles/main.css` importiert `tokens-v2.css` als erste Regel und lädt **Supreme** in 400,
500 und 700 aus `src/assets/fonts/` (gebündelt von Vite, 600 fällt auf Bold).

## Abweichung vom gemeinsamen Set: Blau-Gold

Der Musikplayer nutzt seit Etappe 1 eigene **Farbwerte** (Struktur, Namen, Abstände, Radien,
Typografie und Regeln bleiben wie im gemeinsamen Set; davor Schwarz-Gold):

- Dark: dunkelblaue Flächen (`--ds-surface-0` `#081220`), Gold `#f3c56b`, Text kühles Weiß,
  Link Cyan `#79dcf2`.
- Light: hellblaue Flächen (`#eef5fc`), Text Dunkelblau, Gold wie Dark mit `--ds-on-accent`
  `#221605`, Link Petrol `#076779`.
- Fokus-Ring in `--ds-link` (Cyan/Petrol) statt Gold, damit er sich von goldenen Flächen abhebt.
- `--ds-accent-bright` (JSON `accentBright`), hellgelber Zweitakzent für Fortschrittsbalken
  und Visualizer-Spitzen. Nie als Textfarbe verwenden.
- `--ds-page-glow` und `--ds-page-backdrop`: dezenter radialer Verlauf hinter Landingpage und
  Player. Das ist der **einzige** erlaubte Verlauf; Styles nutzen ihn nur als
  `background-image: var(--ds-page-backdrop)`.
- `--ds-text-display`, `--ds-leading-display`, `--ds-tracking-display`: fließender
  Einstiegstitel der Landingpage. `--ds-container-wide` (1232 px): Inhaltsbreite beider Seiten.

Das Seitenlayout dazu steht in `src/assets/styles/kodini-layout-stage1.css` (nur Tokens, keine
eigenen Variablen); beide Astro-Seiten setzen dafür `html.kodini-player-page`.

Beim nächsten Abgleich mit dem Playlist Generator diese Werte nicht überschreiben, sondern
entweder dort übernehmen oder hier bewusst beibehalten.

## Theme-Mechanik

- Standard ist Light. Ein Inline-Skript im `<head>` beider Astro-Seiten setzt `html[data-theme]`,
  `html.dark` und `meta[theme-color]` vor dem ersten Paint aus `localStorage.theme`; ein zweites am
  Anfang von `<body>` setzt `body.light-theme`.
- In der App übernimmt `stores/settingsStore.js` (Pinia): `html[data-theme]` (Tokens und
  SSI-Partials), `body.light-theme` (Parität zum Playlist Generator), `html.dark` (externe Skripte),
  `meta[theme-color]` = `--ds-surface-0`. Er folgt `html[data-theme]` per `MutationObserver` und dem
  Ereignis `theme-changed` der globalen Navigation.
- Die Landing-Page (ohne Vue) nutzt `initStaticPartialSync()` aus `utils/ssiNav.js`.
- `color-scheme` folgt dem Theme, damit native Select-Listen und Scrollbalken passen.
- Komponenten kennen kein Theme: Sie nutzen ausschließlich `--ds-*`, nie Theme-Selektoren.

## SSI-Partials

- `utils/ssiNav.js` übersetzt die globale Navigation (`data-i18n`, `data-i18n-aria`,
  `data-i18n-title`, inklusive des `<nav>` selbst), hält die Sprach-Buttons und das Theme-Symbol
  synchron. Sprache folgt `locale-changed` und Klicks auf `.global-nav-lang-btn`.
- `main.css` gleicht die Partials an: eigene Hintergründe transparent, Dropdowns auf
  `--ds-surface-1`, Text `--ds-text`, Links `--ds-link`, Hover `--ds-accent`, Cookie-Banner
  ausgenommen und immer zuoberst. Alle App-Teile direkt unter `body` außer der `astro-island`
  tragen dafür die Klasse `ds-app` (Player-Leiste, Toasts, Dialog, `<main>` der Landing-Page).

## Regeln

Gold füllt nur Hauptaktionen (Wiedergabe-Button, „Dateien auswählen“, Logo), sonst zeigt es nur Zustand
(`--ds-accent-soft` plus 1-px-Akzentrahmen, Slider-Daumen, Umschalter „an“). Ein Rahmen
(1 px), drei Radien, Schatten nur für Overlays (Dialog, Toast, schwebender Kürzel-Button). Hover
ändert Farbe, nie Größe. Löschen ist `--ds-danger` als Icon-Farbe auf flacher Fläche. Toasts zeigen
Status als Icon und 3-px-Linie. `src/tests/designTokens.spec.ts` verhindert die Rückkehr der alten
Glas-/3D-Palette, von Gradients (außer `--ds-page-backdrop`), Blur, Glow, Skalierung, freien Schriftgraden, Radien und Schatten.
