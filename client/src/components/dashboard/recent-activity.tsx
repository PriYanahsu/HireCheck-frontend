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
        <CardHeader className="px-3 py-2.5 sm:p-6 sm:pb-4">
          <CardTitle className="text-[13px] sm:text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
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
        <CardHeader className="px-3 py-2.5 sm:p-6 sm:pb-4">
          <CardTitle className="text-[13px] sm:text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0 sm:p-6 sm:pt-0">
          <p className="text-xs text-destructive">
            Error loading recent activity: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-3 py-2.5 sm:p-6 sm:pb-4">
        <CardTitle className="text-[13px] sm:text-lg font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 sm:p-6 sm:pt-0">
        {activities && activities.length > 0 ? (
          <ul
            className={cn(
              "divide-y divide-border",
              activities.length > 3 &&
                "max-h-[12.75rem] overflow-y-auto overscroll-contain sm:max-h-[16.5rem]"
            )}
          >
            {activities.map((activity, index) => (
              <li
                key={`${activity.candidateId}-${index}`}
                className="py-2.5 first:pt-0 last:pb-0 sm:py-3.5"
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      "mt-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0",
                      activity.action === "completed" ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] sm:text-sm font-medium truncate leading-tight">
                        {activity.candidateName}
                      </p>
                      {activity.action === "completed" && (
                        <Badge
                          variant={activity.autoSubmitted ? "destructive" : "success"}
                          className="shrink-0 text-[9px] sm:text-xs px-1.5 py-0 h-4 sm:h-5 font-medium"
                        >
                          {activity.autoSubmitted
                            ? "Auto"
                            : `${activity.score}%`}
                        </Badge>
                      )}
                      {activity.action === "started" && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[9px] sm:text-xs px-1.5 py-0 h-4 sm:h-5"
                        >
                          Live
                        </Badge>
                      )}
                    </div>

                    <p className="text-[11px] sm:text-sm text-muted-foreground truncate mt-0.5 leading-snug">
                      <span className="sm:hidden">
                        {activity.action === "completed" ? "Done" : "Started"} · {activity.testTitle}
                      </span>
                      <span className="hidden sm:inline">
                        {activity.action === "completed" ? "Completed" : "Started"}{" "}
                        <span className="text-foreground/80">"{activity.testTitle}"</span>
                      </span>
                    </p>

                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      <span className="sm:hidden">{compactTime(activity.timestamp)}</span>
                      <span className="hidden sm:inline">{getRelativeTime(activity.timestamp)}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground">No recent activity found</p>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivity;
