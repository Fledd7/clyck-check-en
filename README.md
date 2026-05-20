# YouTube Klarheitscheck

Ein schlanker, eigenständiger Lead-Funnel für einen YouTube-Packaging- und Thumbnail-Designer.
Potenzielle Kund:innen beantworten fünf strategische Fragen zu ihrem Kanal und erhalten eine
kurze erste Einschätzung der Klarheit, des Packaging-Systems und der Thumbnail-Linie.
Anschließend können sie eine persönliche Einschätzung anfragen.

Die Anwendung ist kein Generator und kein Analytics-Dashboard, sondern ein
strategisches Mini-Audit, das gleichzeitig Leads qualifiziert.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS
- Vercel-kompatible Serverless Functions (`/api`)
- Keine Datenbank, kein Login, keine Zahlungen

## Setup

```bash
npm install
npm run dev
```

Die App läuft unter `/`.

## Build

```bash
npm run build
npm run preview
```

## Environment Variablen

In Vercel (oder lokal via `.env`) konfigurieren:

```
YOUTUBE_API_KEY=
RESEND_API_KEY=
LEAD_TO_EMAIL=
LEAD_FROM_EMAIL=
```

- `YOUTUBE_API_KEY` ist optional. Fehlt der Key, funktioniert die App weiterhin —
  die optionale Kanalverlinkung liefert dann einfach keine Daten.
- `RESEND_API_KEY`, `LEAD_TO_EMAIL` und `LEAD_FROM_EMAIL` werden vom Lead-Endpoint
  (`/api/lead`) benötigt, um eine Benachrichtigungs-E-Mail über Resend zu senden.

## Deployment

Vercel erkennt die Vite-App automatisch und deployt die Functions unter `/api`.
Stelle sicher, dass die obigen Environment Variablen im Vercel-Projekt gesetzt sind.

## Struktur

```
src/
  App.tsx                 Zustandsmaschine für den gesamten Flow
  components/             UI-Komponenten (Startscreen, Fragen, Result, Lead)
  lib/                    Fragen, Scoring, Result-Logik, Types
api/
  channel-check.ts        YouTube Data API v3 Lookup (optional)
  lead.ts                 Resend-E-Mail mit Antworten + Score + Lead-Klasse
```
