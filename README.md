# RETHINK. MIND — Complete Static PWA

Eine vollständig statische Mental-Performance-PWA. Kein Backend, kein Konto und kein Render-Webservice notwendig.

## Inhalt
- Einmaliges Setup: Kontext, Hauptziel, Sessionlänge
- 7 Mental Skills: Focus, Control, Self-Talk, Imagery, Confidence, Resilience, Pressure
- 56 Drills in 4 Schwierigkeitsstufen
- Adaptive Daily Sessions auf Basis von Readiness, Trainingsindex, Ziel und zuletzt genutzten Drills
- Performance- und Reset-Kurzsessions
- freie Drill Library
- 8-Wochen-Blocklogik: Awareness → Stability → Pressure → Transfer
- sportartspezifische Transfer-Sprache
- Training Index pro Skill (keine Diagnose)
- Wochenstatistik, Streak, 14-Tage-Verlauf, letzter Transfer
- lokale Offline-Speicherung
- JSON Export/Import
- installierbare PWA mit Service Worker
- Zoom deaktiviert; Kerntraining auf Handy/Tablet ohne notwendiges Scrollen

## Deployment ohne Render
Die App braucht nur statisches Hosting über HTTPS. Geeignet sind GitHub Pages, Cloudflare Pages, Netlify oder jeder normale Webspace. Es gibt keinen Servercode.

Für GitHub Pages genügt es, den Inhalt dieses Ordners in ein Repository zu legen und Pages für den Branch zu aktivieren.

## Änderungen
- Übungen und Texte: `js/exercises.js`
- Logik/Scoring/Sessionbau: `js/app.js`
- Design: `styles.css`
- App Shell: `index.html`

## Hinweis zum Score
Der Mental Performance Index ist ein Trainingsindex aus Aufgabenleistung und Selbsteinschätzung. Er ist keine psychologische/medizinische Diagnostik.


## v4 UX update
- 5-second read/start countdown before every drill
- exact breath-orb phase animation (4/6, box, physiological reset, activation)
- concise single instruction + pill-based action cues; duplicate scenario copy removed
