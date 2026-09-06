import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStudies } from "../hooks/useStudies";
import { limitsForPlan } from "../lib/planLimits";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

function studyStatus(study) {
  if (study.uploadCount > 0) return study.status === "completed" ? "completed" : "active";
  return "active";
}

function StudyCard({ study }) {
  const status = studyStatus(study);
  return (
    <div className="flex flex-col p-unit-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow gap-unit-3">
      <div className="flex items-start justify-between gap-unit-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-unit-2">
            <span className="inline-flex items-center gap-unit-1 px-unit-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              {status === "completed" ? "Completed" : "Active"}
            </span>
          </div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface mt-1 truncate">{study.name}</h2>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {(study.conditions || []).length} condition marker{(study.conditions || []).length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-unit-1">
        <div className="inline-flex items-center gap-unit-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">group</span>
          <span className="font-label-lg text-label-lg">{study.uploadCount || 0}</span>
          <span className="font-body-sm text-body-sm text-outline">uploads</span>
        </div>
        <Link
          to={`/study/${study.id}`}
          className="inline-flex items-center gap-unit-1 text-primary hover:text-primary-container font-label-lg text-label-lg"
        >
          <span>View Results</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { studies, loading } = useStudies(user?.uid);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return studies.filter((s) => {
      const status = studyStatus(s);
      const matchesFilter = filter === "all" || status === filter;
      const matchesSearch = s.name?.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [studies, filter, search]);

  const limits = limitsForPlan(profile?.plan || "free");
  const atStudyLimit = studies.length >= limits.maxStudies;

  return (
    <div className="flex flex-col w-full px-gutter-mobile md:px-gutter-desktop py-unit-4 gap-unit-5">
      <div className="flex flex-col gap-unit-4">
        <div className="flex items-center justify-between gap-unit-3">
          <div className="flex flex-col">
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">
              Your Studies
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Uploaded sessions, parsed stats, and exportable reports
            </span>
          </div>
          <Link
            to="/study/new"
            aria-disabled={atStudyLimit}
            onClick={(e) => atStudyLimit && e.preventDefault()}
            className={`inline-flex items-center gap-unit-2 px-unit-4 py-unit-2 rounded-xl font-label-lg text-label-lg shadow-sm active:scale-95 transition-transform ${
              atStudyLimit
                ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                : "bg-primary text-on-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>New Study</span>
          </Link>
        </div>

        {atStudyLimit && (
          <div className="flex items-center gap-unit-2 p-unit-3 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            Free plan is limited to {limits.maxStudies} study. Archive or upgrade to create another.
          </div>
        )}

        <div className="flex items-center gap-unit-2 px-unit-3 py-unit-2 rounded-xl bg-surface-container-low shadow-sm">
          <span className="material-symbols-outlined text-outline text-[20px]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search studies..."
            className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-unit-2 overflow-x-auto pb-unit-1 hide-scrollbar">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-unit-4 py-unit-1 rounded-full font-label-sm text-label-sm transition-all ${
                filter === f.key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {f.label} ({f.key === "all" ? studies.length : studies.filter((s) => studyStatus(s) === f.key).length})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">Loading studies…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-unit-12 px-unit-4 rounded-xl bg-surface-container-lowest text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary mb-unit-3">
            <span className="material-symbols-outlined text-[32px]">science</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">No studies yet</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-xs">
            Create a study and upload your first biometric CSV to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-unit-3">
          {filtered.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      )}
    </div>
  );
}
