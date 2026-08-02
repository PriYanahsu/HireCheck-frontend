import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, Send } from "lucide-react";

type DashboardStats = {
  activeTests: number;
  pendingAssessments: number;
  completedTests: number;
};

export function QuickStats() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const items = [
    {
      label: "Active assessments",
      shortLabel: "Active",
      value: stats?.activeTests ?? 0,
      icon: Send,
      color: "text-indigo-600",
    },
    {
      label: "Awaiting completion",
      shortLabel: "Awaiting",
      value: stats?.pendingAssessments ?? 0,
      icon: Clock,
      color: "text-amber-600",
    },
    {
      label: "Total completions",
      shortLabel: "Completed",
      value: stats?.completedTests ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="px-3 py-2.5 sm:p-6 sm:pb-4">
        <CardTitle className="text-[13px] sm:text-base font-medium">Pipeline Summary</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <div className="space-y-2 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-7 sm:h-9 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-4">
            {items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <item.icon className={`h-3 w-3 sm:h-4 sm:w-4 shrink-0 ${item.color}`} />
                  <span className="text-[11px] sm:text-sm text-muted-foreground truncate">
                    <span className="sm:hidden">{item.shortLabel}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </span>
                </div>
                <span className="text-[13px] sm:text-lg font-semibold shrink-0 tabular-nums">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuickStats;
