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
      value: stats?.activeTests ?? 0,
      icon: Send,
      color: "text-indigo-600",
    },
    {
      label: "Awaiting completion",
      value: stats?.pendingAssessments ?? 0,
      icon: Clock,
      color: "text-amber-600",
    },
    {
      label: "Total completions",
      value: stats?.completedTests ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
        <CardTitle className="text-sm sm:text-base font-medium">Pipeline Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <item.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${item.color}`} />
                  <span className="text-xs sm:text-sm text-muted-foreground truncate">{item.label}</span>
                </div>
                <span className="text-base sm:text-lg font-semibold shrink-0">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuickStats;
