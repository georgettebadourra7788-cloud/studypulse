import PageLayout from "../components/PageLayout";
import DashboardView from "../components/Dashboard";

export default function DashboardPage() {
  return (
    <PageLayout title="StudyPulse" subtitle="Studies">
      <DashboardView />
    </PageLayout>
  );
}
