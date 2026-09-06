import Papa from "papaparse";

// Case-insensitive header candidates for auto-detecting the columns a
// biometric CSV export is likely to use. First match wins per field.
const COLUMN_ALIASES = {
  timestamp: ["timestamp", "time", "time (s)", "elapsed", "datetime", "date"],
  gsr: ["gsr", "eda", "skin conductance", "scr", "microsiemens", "μs"],
  hr: ["hr", "heart rate", "heartrate", "bpm", "pulse"],
  pupil: ["pupil size", "pupil diameter", "pupil", "dilation"],
};

function normalizeHeader(header) {
  return header.trim().toLowerCase();
}

/**
 * Attempts to auto-detect timestamp/gsr/hr/pupil columns from parsed CSV
 * headers. Returns a mapping of field -> header name (or null if unmatched)
 * so the caller can fall back to a manual mapping UI on partial matches.
 */
export function autoDetectColumns(headers) {
  const normalized = headers.map(normalizeHeader);
  const mapping = {};

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const matchIndex = normalized.findIndex((h) => aliases.some((alias) => h.includes(alias)));
    mapping[field] = matchIndex === -1 ? null : headers[matchIndex];
  }

  return mapping;
}

/**
 * Parses a CSV File client-side with Papaparse. Resolves with the raw rows,
 * detected headers, and a best-effort column mapping (timestamp/gsr/hr/pupil).
 */
export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({
          rows: results.data,
          headers,
          columnMapping: autoDetectColumns(headers),
          errors: results.errors,
        });
      },
      error: (error) => reject(error),
    });
  });
}

/**
 * Given raw parsed rows and a confirmed column mapping, produces a clean
 * array of { t, gsr, hr, pupil } samples used by the stats engine and charts.
 */
export function normalizeSamples(rows, columnMapping) {
  return rows
    .map((row) => ({
      t: columnMapping.timestamp ? row[columnMapping.timestamp] : null,
      gsr: columnMapping.gsr ? Number(row[columnMapping.gsr]) : null,
      hr: columnMapping.hr ? Number(row[columnMapping.hr]) : null,
      pupil: columnMapping.pupil ? Number(row[columnMapping.pupil]) : null,
    }))
    .filter((sample) => sample.t !== null && sample.t !== undefined && sample.t !== "");
}
