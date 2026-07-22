import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/utils";
import { Clock, Plus, HelpCircle } from "lucide-react";

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

export function TestsList() {
  const { data: tests, isLoading, error } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Active Assessments</CardTitle>
          <Skeleton className="h-9 w-28" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-b border-border">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
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
          <CardTitle className="text-lg font-medium">Active Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error loading tests: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Active Assessments</CardTitle>
        <Button asChild size="sm">
          <Link href="/tests/create">
            <Plus className="mr-1.5 h-4 w-4" />
            Create New
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
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-primary truncate">
                            {test.title}
                          </div>
                          <Badge variant={isActive ? "success" : "outline"}>
                            {isActive ? "Active" : "Idle"}
                          </Badge>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <div className="sm:flex gap-6">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              {formatDuration(test.duration)}
                            </div>
                            <div className="mt-2 sm:mt-0 flex items-center text-sm text-muted-foreground">
                              <HelpCircle className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              {test.questionCount ?? 0} questions
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {test.stats.total} sent / {test.stats.completed} completed
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
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You haven't created any tests yet.
            </p>
            <Button asChild>
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
