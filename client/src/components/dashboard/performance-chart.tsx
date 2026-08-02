import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

type PerformanceItem = {
  testId: number;
  name: string;
  score: number;
  completed: number;
};

export function PerformanceChart() {
  const { data: scores, isLoading, error } = useQuery<PerformanceItem[]>({
    queryKey: ["/api/dashboard/performance"],
  });

  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
        <CardTitle className="text-sm sm:text-base font-medium">Test Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Failed to load performance data</p>
        ) : scores && scores.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {scores.map((item) => (
              <div key={item.testId}>
                <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5 gap-2">
                  <span className="truncate text-muted-foreground">{item.name}</span>
                  <span className="font-semibold text-foreground shrink-0">{item.score}%</span>
                </div>
                <Progress value={item.score} className="h-1.5 sm:h-2" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-3 sm:py-4">
            No completed assessments yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default PerformanceChart;
