import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import UploadZone from "../components/UploadZone";
import StudyResults from "../components/StudyResults";
import ReportExport from "../components/ReportExport";
import { useStudy } from "../hooks/useStudy";

const TABS = [
  { key: "results", label: "Results", icon: "monitoring" },
  { key: "upload", label: "Upload", icon: "upload_file" },
  { key: "export", label: "Export", icon: "picture_as_pdf" },
];

export default function Study() {
  const { studyId } = useParams();
  const { study, uploads } = useStudy(studyId);
  const [tab, setTab] = useState("results");

  if (study === undefined) {
    return (
      <PageLayout title="StudyPulse" subtitle="Loading…">
        <p className="px-gutter-mobile py-unit-4 font-body-sm text-body-sm text-on-surface-variant">Loading study…</p>
      </PageLayout>
    );
  }

  if (study === null) {
    return (
      <PageLayout title="StudyPulse" subtitle="Not found">
        <p className="px-gutter-mobile py-unit-4 font-body-sm text-body-sm text-on-surface-variant">
          Study not found. <Link to="/dashboard" className="text-primary">Back to studies</Link>
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={study.name} subtitle="Study">
      <div className="flex flex-col w-full px-gutter-mobile md:px-gutter-desktop py-unit-4 gap-unit-4">
        <Link to="/dashboard" className="inline-flex items-center gap-unit-1 text-primary hover:text-primary-container transition-colors w-fit">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="font-label-md text-label-md">Back to Studies</span>
        </Link>

        <div className="flex items-center gap-unit-2 bg-surface-container-low rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-unit-1 px-unit-3 py-unit-2 rounded-lg font-label-md text-label-md transition-colors ${
                tab === t.key ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "results" && <StudyResults study={study} uploads={uploads} />}
        {tab === "upload" && (
          <UploadZone study={study} uploadCount={uploads.length} onUploaded={() => setTab("results")} />
        )}
        {tab === "export" && <ReportExport study={study} uploads={uploads} />}
      </div>
    </PageLayout>
  );
}
