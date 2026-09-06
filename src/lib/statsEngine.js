function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values, avg) {
  if (values.length < 2) return null;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function metricStats(values) {
  const clean = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (!clean.length) return null;
  const avg = mean(clean);
  return {
    mean: avg,
    peak: Math.max(...clean),
    min: Math.min(...clean),
    stdDev: stdDev(clean, avg),
    sampleCount: clean.length,
  };
}

function parseTimestamp(t) {
  if (typeof t === "number") return t;
  const asNumber = Number(t);
  if (!Number.isNaN(asNumber)) return asNumber;
  const asDate = new Date(t).getTime();
  return Number.isNaN(asDate) ? null : asDate / 1000;
}

/**
 * Computes per-file summary statistics (mean/peak/std dev per metric, plus
 * session duration) from normalized { t, gsr, hr, pupil } samples.
 */
export function computeStats(samples) {
  if (!samples.length) {
    return { gsr: null, hr: null, pupil: null, durationSeconds: null, sampleCount: 0 };
  }

  const timestamps = samples.map((s) => parseTimestamp(s.t)).filter((t) => t !== null);
  const durationSeconds =
    timestamps.length > 1 ? Math.max(...timestamps) - Math.min(...timestamps) : null;

  return {
    gsr: metricStats(samples.map((s) => s.gsr)),
    hr: metricStats(samples.map((s) => s.hr)),
    pupil: metricStats(samples.map((s) => s.pupil)),
    durationSeconds,
    sampleCount: samples.length,
  };
}

/**
 * Aggregates the per-upload parsedStats of a study into cohort-level summary
 * cards (mean of means, overall peak, participant count).
 */
export function aggregateUploadStats(uploads) {
  const withStats = uploads.filter((u) => u.parsedStats);
  const aggregateMetric = (key) => {
    const means = withStats.map((u) => u.parsedStats[key]?.mean).filter((v) => typeof v === "number");
    const peaks = withStats.map((u) => u.parsedStats[key]?.peak).filter((v) => typeof v === "number");
    if (!means.length) return null;
    return { mean: mean(means), peak: Math.max(...peaks) };
  };

  return {
    participantCount: withStats.length,
    gsr: aggregateMetric("gsr"),
    hr: aggregateMetric("hr"),
    pupil: aggregateMetric("pupil"),
  };
}

/**
 * Downsamples normalized samples to at most `maxPoints` evenly-spaced points
 * so a full-resolution recording (potentially hundreds of thousands of rows)
 * can be stored in a single Firestore document and charted cheaply.
 */
export function downsampleSeries(samples, maxPoints = 200) {
  if (samples.length <= maxPoints) return samples;
  const step = samples.length / maxPoints;
  const result = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(samples[Math.floor(i * step)]);
  }
  return result;
}

export function formatDuration(seconds) {
  if (!seconds || Number.isNaN(seconds)) return "--";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s}s`;
}
