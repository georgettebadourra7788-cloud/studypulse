import PageLayout from "../components/PageLayout";
import { useAuth } from "../context/AuthContext";
import { limitsForPlan } from "../lib/planLimits";
import { useStudies } from "../hooks/useStudies";

const PLAN_LABELS = { free: "Free", researcher: "Researcher", lab: "Lab" };

export default function Account() {
  const { user, profile, logOut } = useAuth();
  const { studies } = useStudies(user?.uid);
  const limits = limitsForPlan(profile?.plan || "free");

  return (
    <PageLayout title="StudyPulse" subtitle="Account">
      <div className="flex flex-col w-full px-gutter-mobile md:px-gutter-desktop py-unit-4 gap-unit-5 max-w-xl">
        <div className="bg-surface-container-lowest rounded-xl p-unit-4 shadow-sm flex flex-col gap-unit-2">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Signed in as</span>
          <span className="font-label-lg text-label-lg text-on-surface">{user?.email}</span>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-unit-4 shadow-sm flex flex-col gap-unit-3">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Plan</span>
            <span className="inline-flex items-center gap-1 px-unit-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm">
              {PLAN_LABELS[profile?.plan] || "Free"}
            </span>
          </div>
          <ul className="font-body-sm text-body-sm text-on-surface-variant flex flex-col gap-1">
            <li>
              Studies: {studies.length} / {limits.maxStudies === Infinity ? "∞" : limits.maxStudies}
            </li>
            <li>
              Uploads per study: {limits.maxUploadsPerStudy === Infinity ? "∞" : limits.maxUploadsPerStudy}
            </li>
            <li>PDF watermark: {limits.watermarkExports ? "Yes" : "No"}</li>
          </ul>
          {profile?.plan === "free" && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Upgrading plans isn't wired up to billing yet — set <code>users/&#123;uid&#125;.plan</code> to
              "researcher" or "lab" in Firestore to test higher tiers.
            </p>
          )}
        </div>

        <button
          onClick={logOut}
          className="h-11 rounded-lg border border-outline-variant text-error font-label-lg text-label-lg hover:bg-error-container/30 transition-colors"
        >
          Log out
        </button>
      </div>
    </PageLayout>
  );
}
