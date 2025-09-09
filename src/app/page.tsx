import DashboardLayout from "./(dashboard)/layout";
import DashboardOverviewPage from "./(dashboard)/page";

export default function HomePage() {
  return (
    <DashboardLayout>
      <DashboardOverviewPage />
    </DashboardLayout>
  );
}
