import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { PageShell } from "@/components/layout/page-shell";
import StatsCard from "@/components/dashboard/stats-card";
import RecentActivity from "@/components/dashboard/recent-activity";
import TestsList from "@/components/dashboard/tests-list";
import PerformanceChart from "@/components/dashboard/performance-chart";
import PendingInvites from "@/components/dashboard/upcoming-tests";
import QuickStats from "@/components/dashboard/quick-stats";
import { BarChart, FileQuestion, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <PageShell
      title="Dashboard"
      subtitle="Your recruitment pipeline at a glance"
      action={
        <Button asChild>
          <Link href="/tests/create">
            <Plus className="h-4 w-4" />
            Create Test
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Active Tests"
          value={stats?.activeTests || 0}
          icon={<FileQuestion className="h-6 w-6" />}
          accentColor="border-l-indigo-500"
        />
        <StatsCard
          title="Pending Assessments"
          value={stats?.pendingAssessments || 0}
          icon={<Users className="h-6 w-6" />}
          accentColor="border-l-amber-500"
        />
        <StatsCard
          title="Completions"
          value={stats?.completedTests || 0}
          icon={<BarChart className="h-6 w-6" />}
          accentColor="border-l-emerald-500"
        />
      </div>

      <div className="mb-6">
        <RecentActivity />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PendingInvites />
        <PerformanceChart />
        <QuickStats />
      </div>

      <TestsList />
    </PageShell>
  );
}
