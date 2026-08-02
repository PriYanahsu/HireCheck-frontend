import { useQuery } from "@tanstack/react-query";
import { getRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Activity = {
  candidateId: number;
  candidateName: string;
  testId: number;
  testTitle: string;
  action: "completed" | "started";
  timestamp: string;
  score?: number;
  autoSubmitted?: boolean;
};

function dedupeActivities(activities: Activity[]): Activity[] {
  const byKey = new Map<string, Activity>();

  for (const activity of activities) {
    const key = `${activity.candidateId}:${activity.testId}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, activity);
      continue;
    }
    if (activity.action === "completed" && existing.action !== "completed") {
      byKey.set(key, activity);
    } else if (
      activity.action === existing.action &&
      activity.timestamp > existing.timestamp
    ) {
      byKey.set(key, activity);
    }
  }

  return Array.from(byKey.values()).sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );
}

function compactTime(date: string): string {
  const relative = getRelativeTime(date);
  // Avoid the long absolute fallback on mobile cards
  if (relative.includes(",")) {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return relative;
}

export function RecentActivity() {
  const { data: rawActivities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ["/api/dashboard/recent-activity"],
  });

  const activities = rawActivities ? dedupeActivities(rawActivities) : rawActivities;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-sm text-destructive">
            Error loading recent activity: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {activities && activities.length > 0 ? (
          <ul className="divide-y divide-border">
            {activities.map((activity, index) => (
              <li
                key={`${activity.candidateId}-${index}`}
                className={cn("py-3 first:pt-0 last:pb-0", "sm:py-3.5")}
              >
                {/* Mobile: stacked. Desktop: side-by-side */}
                <div className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      "mt-1.5 h-2 w-2 rounded-full shrink-0",
                      activity.action === "completed" ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{activity.candidateName}</p>
                      {activity.action === "completed" && (
                        <Badge
                          variant={activity.autoSubmitted ? "destructive" : "success"}
                          className="shrink-0 text-[10px] sm:text-xs px-1.5 py-0 h-5"
                        >
                          {activity.autoSubmitted
                            ? "Auto-submitted"
                            : `Score ${activity.score}%`}
                        </Badge>
                      )}
                      {activity.action === "started" && (
                        <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs px-1.5 py-0 h-5">
                          In progress
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {activity.action === "completed" ? "Completed" : "Started"}
                    </p>

                    <p className="text-sm text-foreground/90 truncate" title={activity.testTitle}>
                      {activity.testTitle}
                    </p>

                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                      <span className="sm:hidden">{compactTime(activity.timestamp)}</span>
                      <span className="hidden sm:inline">{getRelativeTime(activity.timestamp)}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No recent activity found</p>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivity;
