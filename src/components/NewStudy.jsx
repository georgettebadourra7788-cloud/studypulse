import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useStudies } from "../hooks/useStudies";
import { canCreateStudy, limitsForPlan } from "../lib/planLimits";

const TAG_COLORS = ["bg-secondary", "bg-primary", "bg-tertiary"];

export default function NewStudy() {
  const { user, profile } = useAuth();
  const { studies } = useStudies(user?.uid);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [conditions, setConditions] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const limits = limitsForPlan(profile?.plan || "free");
  const blocked = !canCreateStudy(profile?.plan || "free", studies.length);

  function addTag() {
    const label = tagInput.trim();
    if (!label) return;
    setConditions((prev) => [...prev, { label, color: TAG_COLORS[prev.length % TAG_COLORS.length] }]);
    setTagInput("");
  }

  function removeTag(index) {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || blocked) return;
    setBusy(true);
    setError("");
    try {
      const docRef = await addDoc(collection(db, "studies"), {
        ownerId: user.uid,
        name: name.trim(),
        conditions,
        uploadCount: 0,
        status: "active",
        createdAt: serverTimestamp(),
      });
      navigate(`/study/${docRef.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col w-full px-gutter-mobile md:px-gutter-desktop py-unit-4 gap-unit-5 max-w-2xl">
      <div className="flex flex-col gap-unit-1">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">
          New Biometric Study
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Name your study and tag the conditions or events you'll mark in the data. You'll upload CSV files next.
        </p>
      </div>

      {blocked && (
        <div className="flex items-center gap-unit-2 p-unit-3 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
          <span className="material-symbols-outlined text-[18px]">lock</span>
          Free plan is limited to {limits.maxStudies} study. Upgrade your plan to create more.
        </div>
      )}

      <form onSubmit={handleCreate} className="flex flex-col gap-unit-4">
        <div className="bg-surface-container-lowest rounded-xl p-unit-4 shadow-sm flex flex-col gap-unit-4">
          <label className="flex flex-col gap-unit-1">
            <span className="font-label-md text-label-md text-on-surface-variant">STUDY TITLE / DESIGNATION</span>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px]">
                science
              </span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prefrontal Cortical Stress Protocol - Trial #4"
                className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </label>

          <div className="flex flex-col gap-unit-2">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">CONDITION &amp; EVENT MARKERS</span>
              <span className="text-secondary font-label-sm text-label-sm">{conditions.length} labels</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {conditions.map((tag, i) => (
                <span
                  key={`${tag.label}-${i}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm shadow-sm"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${tag.color}`} />
                  {tag.label}
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="ml-1 text-on-surface-variant hover:text-error transition-colors flex items-center"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-unit-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Baseline, Stress Induction, Recovery…"
                className="flex-1 h-10 px-unit-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={addTag}
                className="inline-flex items-center gap-1 px-unit-3 h-10 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm hover:bg-primary-container hover:text-on-primary-container transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add
              </button>
            </div>
          </div>
        </div>

        {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}

        <div className="flex items-center gap-unit-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-12 rounded-lg bg-surface-container-highest text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || blocked || !name.trim()}
            className="flex-[2] h-12 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold shadow-md hover:bg-primary-container transition-all disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create Study & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
