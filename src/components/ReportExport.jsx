import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAuth } from "../context/AuthContext";
import { aggregateUploadStats, formatDuration } from "../lib/statsEngine";
import { shouldWatermark } from "../lib/planLimits";

export default function ReportExport({ study, uploads }) {
  const { profile } = useAuth();
  const reportRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const aggregate = aggregateUploadStats(uploads);
  const watermark = shouldWatermark(profile?.plan || "free");
  const generatedAt = new Date();

  async function handleExport() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      if (watermark) {
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(60);
          pdf.setTextColor(230, 230, 230);
          pdf.text("STUDYPULSE FREE PLAN", pageWidth / 2, pageHeight / 2, {
            angle: 35,
            align: "center",
          });
        }
      }

      pdf.save(`${study.name.replace(/\s+/g, "_")}_report.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-unit-4">
      <div className="flex items-center justify-between gap-unit-3">
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
          Export a branded PDF summary of this study's aggregate stats and per-participant breakdown.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting || !uploads.length}
          className="inline-flex items-center gap-unit-2 px-unit-4 py-unit-2 rounded-lg bg-primary text-on-primary shadow-sm active:scale-95 transition-all disabled:opacity-60 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">
            {exporting ? "progress_activity" : "picture_as_pdf"}
          </span>
          <span className="font-label-md text-label-md">{exporting ? "Exporting…" : "Export PDF"}</span>
        </button>
      </div>

      {watermark && (
        <div className="flex items-center gap-unit-2 p-unit-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">info</span>
          Free plan exports include a StudyPulse watermark. Upgrade to remove it.
        </div>
      )}

      <div className="w-full bg-surface-container-low py-unit-6 px-gutter-mobile flex justify-center overflow-x-auto">
        <div
          ref={reportRef}
          className="w-full max-w-3xl bg-white text-on-surface rounded-xl shadow-xl p-unit-6 md:p-unit-8 flex flex-col gap-unit-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-unit-4 pb-unit-4 border-b border-outline-variant/40">
            <div className="flex items-center gap-unit-3">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[22px]">monitoring</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
                  StudyPulse Biometric Analytics
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                  Study Report
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container p-unit-4 rounded-xl flex flex-col gap-unit-2">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">
              Study
            </span>
            <span className="font-headline-md text-headline-md text-on-surface">{study.name}</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(study.conditions || []).map((tag, i) => (
                <span
                  key={`${tag.label}-${i}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest text-on-surface font-label-sm text-label-sm"
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-unit-3">
            <SummaryTile label="Participants" value={aggregate.participantCount} />
            <SummaryTile label="Mean HR" value={aggregate.hr?.mean?.toFixed(1)} unit="bpm" />
            <SummaryTile label="Peak GSR" value={aggregate.gsr?.peak?.toFixed(1)} unit="µS" />
            <SummaryTile label="Mean GSR" value={aggregate.gsr?.mean?.toFixed(1)} unit="µS" />
          </div>

          <div className="flex flex-col gap-unit-2">
            <span className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-semibold">
              Participant Summary
            </span>
            <div className="overflow-x-auto rounded-xl bg-surface-container-low">
              <table className="w-full text-left text-on-surface text-body-sm font-body-sm">
                <thead className="bg-surface-container font-label-sm text-label-sm text-on-surface-variant uppercase">
                  <tr>
                    <th className="py-2.5 px-unit-3">Participant</th>
                    <th className="py-2.5 px-unit-3">Mean HR</th>
                    <th className="py-2.5 px-unit-3">Peak GSR</th>
                    <th className="py-2.5 px-unit-3 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container/60">
                  {uploads.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2 px-unit-3 font-semibold">{u.participantLabel}</td>
                      <td className="py-2 px-unit-3">{u.parsedStats?.hr?.mean?.toFixed(1) ?? "--"} bpm</td>
                      <td className="py-2 px-unit-3">{u.parsedStats?.gsr?.peak?.toFixed(1) ?? "--"} µS</td>
                      <td className="py-2 px-unit-3 text-right">{formatDuration(u.parsedStats?.durationSeconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-unit-4 border-t border-outline-variant/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-unit-2 font-label-sm text-label-sm text-on-surface-variant">
            <span>Generated by StudyPulse</span>
            <span>{generatedAt.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, unit }) {
  return (
    <div className="bg-surface-container-low p-unit-3 rounded-xl flex flex-col justify-between">
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{label}</span>
      <div className="flex items-baseline gap-1 my-unit-1">
        <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
          {value ?? "--"}
        </span>
        {unit && <span className="font-body-sm text-body-sm text-on-surface-variant">{unit}</span>}
      </div>
    </div>
  );
}
