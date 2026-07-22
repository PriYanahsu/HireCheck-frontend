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
      <CardHeader>
        <CardTitle className="text-base font-medium">Test Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
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
          <div className="space-y-4">
            {scores.map((item) => (
              <div key={item.testId}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="truncate text-muted-foreground">{item.name}</span>
                  <span className="font-semibold text-foreground">{item.score}%</span>
                </div>
                <Progress value={item.score} className="h-2" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No completed assessments yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default PerformanceChart;
