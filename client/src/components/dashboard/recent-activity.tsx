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

/** One row per candidate+test: prefer completed over started. */
function dedupeActivities(activities: Activity[]): Activity[] {
  const byKey = new Map<string, Activity>();

  for (const activity of activities) {
    const key = `${activity.candidateId}:${activity.testId}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, activity);
      continue;
    }
    // Prefer completed; if same action, keep the newer timestamp
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

export function RecentActivity() {
  const { data: rawActivities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ["/api/dashboard/recent-activity"],
  });

  const activities = rawActivities ? dedupeActivities(rawActivities) : rawActivities;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-3 w-3 rounded-full mt-1.5 shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
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
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error loading recent activity: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="relative">
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
            <ul className="space-y-4">
              {activities.map((activity, index) => (
                <li key={`${activity.candidateId}-${index}`} className="relative pl-6">
                  <div
                    className={cn(
                      "absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                      activity.action === "completed"
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    )}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{activity.candidateName}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.action === "completed" ? "Completed" : "Started"}{" "}
                        <span className="text-foreground/80">"{activity.testTitle}"</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(activity.timestamp)}
                      </span>
                      {activity.action === "completed" && (
                        <Badge
                          variant={activity.autoSubmitted ? "destructive" : "success"}
                          className="mt-1"
                        >
                          {activity.autoSubmitted
                            ? "Auto-submitted"
                            : `Score: ${activity.score}%`}
                        </Badge>
                      )}
                      {activity.action === "started" && (
                        <Badge variant="secondary" className="mt-1">
                          In Progress
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent activity found</p>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivity;
