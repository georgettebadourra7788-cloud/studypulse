import { useRef, useState } from "react";
import { ref, uploadBytes } from "firebase/storage";
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { parseCsvFile, normalizeSamples } from "../lib/csvParser";
import { computeStats, downsampleSeries } from "../lib/statsEngine";
import { canAddUpload, limitsForPlan } from "../lib/planLimits";

const FIELD_LABELS = {
  timestamp: "Timestamp",
  gsr: "GSR / EDA (skin conductance)",
  hr: "Heart Rate",
  pupil: "Pupil Size",
};

export default function UploadZone({ study, uploadCount, onUploaded }) {
  const { user, profile } = useAuth();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [rows, setRows] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState(null);
  const [participantLabel, setParticipantLabel] = useState("");
  const [stage, setStage] = useState("idle"); // idle | mapping | saving | done
  const [error, setError] = useState("");

  const limits = limitsForPlan(profile?.plan || "free");
  const blocked = !canAddUpload(profile?.plan || "free", uploadCount);

  async function handleFile(selected) {
    if (!selected) return;
    setError("");
    setFile(selected);
    setParticipantLabel(selected.name.replace(/\.csv$/i, ""));
    try {
      const { rows: parsedRows, headers: parsedHeaders, columnMapping } = await parseCsvFile(selected);
      setRows(parsedRows);
      setHeaders(parsedHeaders);
      setMapping(columnMapping);
      setStage("mapping");
    } catch (err) {
      setError(`Could not parse CSV: ${err.message}`);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  }

  async function handleConfirm() {
    if (!mapping.timestamp) {
      setError("Timestamp column is required.");
      return;
    }
    setStage("saving");
    setError("");
    try {
      const samples = normalizeSamples(rows, mapping);
      const parsedStats = computeStats(samples);
      const series = downsampleSeries(samples, 200);

      const storagePath = `studies/${study.id}/${Date.now()}_${file.name}`;
      await uploadBytes(ref(storage, storagePath), file);

      await addDoc(collection(db, "studies", study.id, "uploads"), {
        fileName: file.name,
        storagePath,
        participantLabel: participantLabel || file.name,
        columnMapping: mapping,
        parsedStats,
        series,
        sizeBytes: file.size,
        uploadedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "studies", study.id), { uploadCount: increment(1) });

      setStage("done");
      onUploaded?.();
      setTimeout(() => resetForm(), 1200);
    } catch (err) {
      setError(err.message);
      setStage("mapping");
    }
  }

  function resetForm() {
    setFile(null);
    setRows(null);
    setHeaders([]);
    setMapping(null);
    setParticipantLabel("");
    setStage("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (blocked) {
    return (
      <div className="flex items-center gap-unit-2 p-unit-3 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
        <span className="material-symbols-outlined text-[18px]">lock</span>
        Free plan is limited to {limits.maxUploadsPerStudy} uploads per study. Upgrade to add more.
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-unit-5 shadow-sm flex flex-col gap-unit-4">
      {stage === "idle" && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-surface-container-low/60 rounded-xl p-unit-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:bg-surface-container-high/60"
        >
          <div className="w-14 h-14 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-primary mb-unit-3">
            <span className="material-symbols-outlined text-[30px]">sensors</span>
          </div>
          <div className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight mb-1">
            Tap to upload or drag biometric CSV
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px]">
            Auto-detects timestamp, GSR, heart-rate, and pupil-size columns.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {stage === "mapping" && (
        <div className="flex flex-col gap-unit-4 text-left">
          <div className="flex items-start justify-between gap-unit-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">description</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="font-label-lg text-label-lg text-on-surface truncate font-semibold">{file.name}</div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {(file.size / 1024).toFixed(0)} KB • {rows.length} rows
                </span>
              </div>
            </div>
          </div>

          <label className="flex flex-col gap-unit-1">
            <span className="font-label-md text-label-md text-on-surface-variant">PARTICIPANT LABEL</span>
            <input
              value={participantLabel}
              onChange={(e) => setParticipantLabel(e.target.value)}
              className="h-10 px-unit-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <div className="flex flex-col gap-unit-2">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Column Mapping</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Auto-detected from headers — adjust if anything looks wrong.
            </p>
            {Object.entries(FIELD_LABELS).map(([field, label]) => (
              <div key={field} className="flex items-center justify-between gap-unit-2 p-unit-2 rounded-lg bg-surface-container-low">
                <span className="font-label-md text-label-md text-on-surface">
                  {label} {field === "timestamp" && <span className="text-error">*</span>}
                </span>
                <select
                  value={mapping[field] || ""}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value || null }))}
                  className="bg-surface-container-lowest rounded-lg px-unit-2 py-1.5 font-label-sm text-label-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— none —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}

          <div className="flex items-center gap-unit-3">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 h-12 rounded-lg bg-surface-container-highest text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-[2] h-12 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">play_arrow</span>
              Confirm &amp; Process Dataset
            </button>
          </div>
        </div>
      )}

      {stage === "saving" && (
        <div className="flex flex-col items-center gap-unit-2 py-unit-6">
          <span className="material-symbols-outlined text-[32px] text-primary animate-spin">progress_activity</span>
          <p className="font-label-lg text-label-lg text-on-surface">Parsing and syncing buffers…</p>
        </div>
      )}

      {stage === "done" && (
        <div className="flex flex-col items-center gap-unit-2 py-unit-6 text-secondary">
          <span className="material-symbols-outlined text-[32px]">check_circle</span>
          <p className="font-label-lg text-label-lg">Upload processed</p>
        </div>
      )}
    </div>
  );
}
