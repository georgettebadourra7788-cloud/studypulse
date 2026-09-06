# Stitch export → React mapping

Source: Google Stitch export "StudyPulse" (design system:
`studypulse_design_system/DESIGN.md`, colors/type/spacing pulled from the
Tailwind config embedded in each exported screen's `code.html`).

| Stitch screen             | React route      | Component                          |
| -------------------------- | ----------------- | ------------------------------------ |
| `studies_dashboard`        | `/dashboard`      | `src/components/Dashboard.jsx`       |
| `new_study_upload`         | `/study/new`      | `src/components/NewStudy.jsx` + `src/components/UploadZone.jsx` |
| `study_results_dashboard`  | `/study/:id` (Results tab) | `src/components/StudyResults.jsx` |
| `report_export_preview`    | `/study/:id` (Export tab)  | `src/components/ReportExport.jsx` |
| `studypulse_logo`          | header/nav brand mark | `src/components/Sidebar.jsx`, `src/components/AppHeader.jsx` (Material Symbols `monitoring` icon standing in for the exported raster logo) |

The exported screens were static single-page mockups with placeholder data
and `onclick`/`<script>` demo interactions (toasts, fake progress bars,
random tag insertion). These were replaced with the real app logic per the
build prompt:

- The bottom-tab nav (`Studies` / `New Study` / `Results` / `Settings`) is
  reworked as a responsive `Sidebar.jsx` (side rail on desktop, bottom bar
  on mobile) with routes that make sense for a real app: `Studies`,
  `New Study`, `Account`. "Results" isn't a standalone route in the app
  since results are always scoped to a study — it's the default tab inside
  `/study/:id` instead.
- `new_study_upload`'s single screen was split into a study-creation form
  (`NewStudy.jsx`) and a reusable upload widget (`UploadZone.jsx`) that's
  also used from inside an existing study to add more participant uploads.
- `study_results_dashboard`'s hand-authored SVG waveform is replaced with a
  live Recharts `LineChart` driven by a downsampled sample series computed
  client-side by `statsEngine.js` at upload time (see `src/lib/`).
- `report_export_preview`'s document mock is the literal DOM captured via
  `html2canvas` and embedded into a `jspdf` PDF on export, so the on-screen
  preview and the exported PDF are always the same layout.

Design tokens (colors, type scale, spacing, radius) were copied verbatim
from the exports' Tailwind config into `src/index.css` as Tailwind v4
`@theme` variables, so utility classes like `bg-primary-fixed` or
`text-headline-lg` match the export exactly.
