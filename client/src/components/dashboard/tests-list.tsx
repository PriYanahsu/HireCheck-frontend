import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, cn } from "@/lib/utils";
import { Clock, Plus, HelpCircle, Users } from "lucide-react";

type Test = {
  id: number;
  title: string;
  duration: number;
  questionCount?: number;
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
};

function shortDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function TestsList() {
  const { data: tests, isLoading, error } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-3 py-2.5 sm:p-6 sm:pb-2">
          <CardTitle className="text-[13px] sm:text-lg font-medium">Active Assessments</CardTitle>
          <Skeleton className="h-7 w-14 sm:h-9 sm:w-28" />
        </CardHeader>
        <CardContent className="p-0">
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-3 py-2.5 border-b border-border space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-32" />
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
        <CardHeader className="px-3 py-2.5 sm:p-6">
          <CardTitle className="text-[13px] sm:text-lg font-medium">Active Assessments</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:p-6 sm:pt-0">
          <p className="text-xs text-destructive">
            Error loading tests: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-3 py-2 sm:p-6 sm:pb-2 gap-2">
        <CardTitle className="text-[13px] sm:text-lg font-medium">Active Assessments</CardTitle>
        <Button asChild size="sm" className="h-7 text-[11px] sm:h-9 sm:text-sm px-2 sm:px-3">
          <Link href="/tests/create">
            <Plus className="mr-0.5 h-3 w-3 sm:mr-1.5 sm:h-4 sm:w-4" />
            <span className="sm:hidden">New</span>
            <span className="hidden sm:inline">Create New</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {tests && tests.length > 0 ? (
          <ul className="divide-y divide-border">
            {tests.map((test) => {
              const isActive =
                test.stats.pending > 0 || test.stats.inProgress > 0;
              return (
                <li key={test.id}>
                  <Link href={`/tests/${test.id}`}>
                    <a className="block hover:bg-muted/40 active:bg-muted/60 transition-colors">
                      {/* Mobile row */}
                      <div className="sm:hidden px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <p
                            className="flex-1 min-w-0 text-[12px] font-medium text-foreground truncate leading-tight"
                            title={test.title}
                          >
                            {test.title}
                          </p>
                          <span
                            className={cn(
                              "text-[9px] font-medium shrink-0 tabular-nums",
                              isActive ? "text-emerald-600" : "text-muted-foreground"
                            )}
                          >
                            {isActive ? "Active" : "Idle"}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground leading-tight tabular-nums">
                          {shortDuration(test.duration)}
                          <span className="mx-1 text-border">·</span>
                          {test.questionCount ?? 0} Q
                          <span className="mx-1 text-border">·</span>
                          {test.stats.total}/{test.stats.completed} done
                        </p>
                      </div>

                      {/* Desktop row */}
                      <div className="hidden sm:block px-6 py-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <h3
                            className="flex-1 min-w-0 text-sm font-medium text-primary truncate"
                            title={test.title}
                          >
                            {test.title}
                          </h3>
                          <Badge
                            variant={isActive ? "success" : "outline"}
                            className="text-xs shrink-0"
                          >
                            {isActive ? "Active" : "Idle"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-5 text-sm text-muted-foreground">
                          <span className="inline-flex items-center">
                            <Clock className="mr-1.5 h-4 w-4" />
                            {formatDuration(test.duration)}
                          </span>
                          <span className="inline-flex items-center">
                            <HelpCircle className="mr-1.5 h-4 w-4" />
                            {test.questionCount ?? 0} questions
                          </span>
                          <span className="inline-flex items-center">
                            <Users className="mr-1.5 h-4 w-4" />
                            {test.stats.total} invited · {test.stats.completed} completed
                          </span>
                        </div>
                      </div>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-3 py-4 sm:px-4 sm:py-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              You haven't created any tests yet.
            </p>
            <Button asChild size="sm" className="h-8 text-xs sm:h-9 sm:text-sm">
              <Link href="/tests/create">
                <Plus className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Create Your First Test
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TestsList;
