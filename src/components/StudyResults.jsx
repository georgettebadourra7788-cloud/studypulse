import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { aggregateUploadStats, formatDuration } from "../lib/statsEngine";

const METRICS = [
  { key: "hr", label: "HR (BPM)", color: "#006194", unit: "bpm" },
  { key: "gsr", label: "GSR (µS)", color: "#006a61", unit: "µS" },
  { key: "pupil", label: "Pupil (mm)", color: "#006195", unit: "mm" },
];

function SummaryCard({ label, value, unit, icon }) {
  return (
    <div className="bg-surface-container-lowest p-unit-4 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
      </div>
      <div className="my-unit-2 flex items-baseline gap-unit-1">
        <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-semibold tracking-tight">
          {value ?? "--"}
        </span>
        {unit && <span className="font-body-sm text-body-sm text-on-surface-variant">{unit}</span>}
      </div>
    </div>
  );
}

export default function StudyResults({ study, uploads }) {
  const [selectedUploadId, setSelectedUploadId] = useState(uploads[0]?.id);
  const [visibleMetrics, setVisibleMetrics] = useState({ hr: true, gsr: true, pupil: false });

  const selectedUpload = uploads.find((u) => u.id === selectedUploadId) || uploads[0];
  const aggregate = useMemo(() => aggregateUploadStats(uploads), [uploads]);

  const chartData = useMemo(() => {
    if (!selectedUpload?.series) return [];
    return selectedUpload.series.map((sample, i) => ({ index: i, ...sample }));
  }, [selectedUpload]);

  if (!uploads.length) {
    return (
      <div className="flex flex-col items-center justify-center py-unit-12 px-unit-4 rounded-xl bg-surface-container-lowest text-center">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary mb-unit-3">
          <span className="material-symbols-outlined text-[32px]">upload_file</span>
        </div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface">No uploads yet</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-xs">
          Upload a biometric CSV to see stats and charts here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-unit-5">
      {(study.conditions || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {study.conditions.map((tag, i) => (
            <span
              key={`${tag.label}-${i}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tag.color}`} />
              {tag.label}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-unit-3">
        <SummaryCard label="Avg Heart Rate" value={aggregate.hr?.mean?.toFixed(1)} unit="bpm" icon="ecg_heart" />
        <SummaryCard label="Peak Arousal (EDA)" value={aggregate.gsr?.peak?.toFixed(1)} unit="µS" icon="electric_bolt" />
        <SummaryCard label="Participants" value={aggregate.participantCount} unit="" icon="group" />
      </div>

      <div className="bg-surface-container-lowest p-unit-4 rounded-xl shadow-sm flex flex-col gap-unit-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-unit-3">
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Telemetry Stream
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {selectedUpload?.participantLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-unit-2">
            <select
              value={selectedUploadId}
              onChange={(e) => setSelectedUploadId(e.target.value)}
              className="bg-surface-container-low rounded-lg px-unit-3 py-1.5 font-label-sm text-label-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {uploads.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.participantLabel}
                </option>
              ))}
            </select>
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setVisibleMetrics((prev) => ({ ...prev, [m.key]: !prev[m.key] }))}
                className={`px-unit-2 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 transition-all ${
                  visibleMetrics[m.key] ? "opacity-100" : "opacity-40"
                }`}
                style={{ backgroundColor: `${m.color}22`, color: m.color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-64 bg-surface-container-low rounded-lg p-unit-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#bfc7d2" />
              <XAxis dataKey="index" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              {METRICS.filter((m) => visibleMetrics[m.key]).map((m) => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  stroke={m.color}
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {selectedUpload?.parsedStats?.durationSeconds != null && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Session duration: {formatDuration(selectedUpload.parsedStats.durationSeconds)} •{" "}
            {selectedUpload.parsedStats.sampleCount} samples
          </p>
        )}
      </div>

      <div className="flex flex-col gap-unit-3">
        <div className="flex items-center gap-unit-2">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Participant Table</h2>
          <span className="px-unit-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
            {uploads.length} recorded
          </span>
        </div>
        <div className="flex flex-col gap-unit-2">
          {uploads.map((u) => (
            <div key={u.id} className="bg-surface-container-lowest p-unit-3 rounded-xl shadow-sm flex flex-col gap-unit-2">
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-on-surface font-semibold">{u.participantLabel}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{u.fileName}</span>
              </div>
              <div className="grid grid-cols-3 gap-unit-2 pt-unit-1">
                <div className="bg-surface-container-low p-unit-2 rounded-lg flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Avg HR</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    {u.parsedStats?.hr?.mean?.toFixed(1) ?? "--"}{" "}
                    <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">bpm</span>
                  </span>
                </div>
                <div className="bg-surface-container-low p-unit-2 rounded-lg flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Peak EDA</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    {u.parsedStats?.gsr?.peak?.toFixed(1) ?? "--"}{" "}
                    <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">µS</span>
                  </span>
                </div>
                <div className="bg-surface-container-low p-unit-2 rounded-lg flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Duration</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    {formatDuration(u.parsedStats?.durationSeconds)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
