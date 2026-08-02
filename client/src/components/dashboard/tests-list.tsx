import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/utils";
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
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base sm:text-lg font-medium">Active Assessments</CardTitle>
          <Skeleton className="h-8 w-24 sm:h-9 sm:w-28" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 sm:p-4 border-b border-border space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-40" />
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
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-medium">Active Assessments</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-sm text-destructive">
            Error loading tests: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 sm:p-6 sm:pb-2 gap-2">
        <CardTitle className="text-base sm:text-lg font-medium">Active Assessments</CardTitle>
        <Button asChild size="sm" className="h-8 text-xs sm:h-9 sm:text-sm">
          <Link href="/tests/create">
            <Plus className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" />
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
                    <a className="block hover:bg-muted/50 transition-colors">
                      <div className="px-3 py-3.5 sm:px-6 sm:py-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <h3
                            className="flex-1 min-w-0 text-sm font-medium text-primary line-clamp-2 sm:truncate sm:line-clamp-none"
                            title={test.title}
                          >
                            {test.title}
                          </h3>
                          <Badge
                            variant={isActive ? "success" : "outline"}
                            className="text-[10px] sm:text-xs shrink-0 mt-0.5"
                          >
                            {isActive ? "Active" : "Idle"}
                          </Badge>
                        </div>

                        {/* Mobile meta — compact & clear */}
                        <div className="sm:hidden space-y-1.5">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {shortDuration(test.duration)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <HelpCircle className="h-3.5 w-3.5" />
                              {test.questionCount ?? 0} Qs
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span>
                              <span className="font-medium text-foreground">{test.stats.total}</span> invited
                            </span>
                            <span>
                              <span className="font-medium text-foreground">{test.stats.completed}</span> completed
                            </span>
                            {test.stats.inProgress > 0 && (
                              <span>
                                <span className="font-medium text-foreground">{test.stats.inProgress}</span> in progress
                              </span>
                            )}
                            {test.stats.pending > 0 && (
                              <span>
                                <span className="font-medium text-foreground">{test.stats.pending}</span> pending
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Desktop meta */}
                        <div className="hidden sm:flex sm:items-center sm:justify-between">
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
                      </div>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-4 py-5 sm:py-6 text-center">
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
              You haven't created any tests yet.
            </p>
            <Button asChild size="sm">
              <Link href="/tests/create">
                <Plus className="mr-1.5 h-4 w-4" />
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
