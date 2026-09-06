# StudyPulse

A web app for UX researchers and academic labs to upload raw biometric
study data (eye-tracking, GSR, heart-rate CSVs) and generate clean stats,
charts, and exportable PDF reports.

Visual design ported from a Google Stitch export — see `STITCH_SOURCE.md`
for the screen → component mapping.

## Tech stack

- **Frontend**: React + Vite, Tailwind CSS v4
- **Backend/Auth/DB**: Firebase (Auth, Firestore, Storage) — Spark (free) plan
- **CSV parsing**: Papaparse (client-side)
- **Charts**: Recharts
- **PDF export**: jsPDF + html2canvas
- **Hosting**: Vercel

All data processing happens client-side — no Cloud Functions are required,
so the app stays on Firebase's free Spark plan.

## Project structure

```
src/
  components/     Dashboard, NewStudy, UploadZone, StudyResults, ReportExport, Sidebar, AppHeader, PageLayout
  context/        AuthContext.jsx (Firebase Auth state + user profile doc)
  hooks/          useStudies.js, useStudy.js (Firestore realtime listeners)
  lib/            firebase.js, csvParser.js, statsEngine.js, planLimits.js
  pages/          Login.jsx, Dashboard.jsx, NewStudyPage.jsx, Study.jsx, Account.jsx
  App.jsx, main.jsx
firebase.json, firestore.rules, firestore.indexes.json, storage.rules
.env.example      (copy to .env.local and fill in your Firebase config)
```

## Firestore schema

```
users/{uid}
  email, plan ("free" | "researcher" | "lab"), createdAt

studies/{studyId}
  ownerId, name, conditions: [{ label, color }], uploadCount, status, createdAt

studies/{studyId}/uploads/{uploadId}
  fileName, storagePath, participantLabel, columnMapping,
  parsedStats: { hr, gsr, pupil, durationSeconds, sampleCount },
  series: [...] (downsampled, ≤200 points, for charting), sizeBytes, uploadedAt
```

## Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
   (Spark/free plan is enough).
2. **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
3. **Firestore Database** → create database (production mode).
4. **Storage** → get started (default bucket).
5. Project settings → General → "Your apps" → add a Web app, copy the config
   into a new `.env.local` (see `.env.example` for the variable names).
6. Deploy security rules and indexes (requires the [Firebase CLI](https://firebase.google.com/docs/cli)):
   ```
   npm install -g firebase-tools
   firebase login
   firebase use --add   # pick your project
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
   The composite index in `firestore.indexes.json` is required for the
   studies-by-owner query (`where ownerId == ... orderBy createdAt desc`) —
   without it, the dashboard's Firestore listener will fail with a
   "requires an index" error until the index finishes building.

## Local development

```
npm install
npm run dev
```

Try the end-to-end flow: sign up → New Study → upload a CSV with
`timestamp`, `hr`/`heart rate`, and `gsr`/`eda` columns (headers are matched
case-insensitively; if auto-detect misses a column, the upload screen lets
you map it manually) → Results tab shows the chart and stats → Export tab
generates a PDF.

## Plan gating (v1)

`users/{uid}.plan` defaults to `"free"` on first sign-in:

- **Free**: 1 study, 3 uploads per study, watermarked PDF exports.
- **Researcher / Lab**: unlimited studies/uploads, no watermark.

There's no billing integration yet — to test a higher tier locally, edit
the `plan` field on your user doc directly in the Firestore console.

## Deploying

```
npm run build
```

Deploy the `dist/` output to Vercel (a `vercel.json` SPA rewrite is
included) and set the `VITE_FIREBASE_*` environment variables in the
Vercel project settings. Firestore/Storage security rules are deployed
separately via the Firebase CLI (see above) — Vercel only hosts the static
frontend.
