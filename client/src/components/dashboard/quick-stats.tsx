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
      <CardHeader>
        <CardTitle className="text-base font-medium">Pipeline Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-lg font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuickStats;
