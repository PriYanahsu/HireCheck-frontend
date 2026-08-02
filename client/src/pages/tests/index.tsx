import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { Test } from "@/lib/schema";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import {
  Plus,
  Search,
  Clock,
  Users,
  CheckCircle,
  MoreHorizontal,
  Eye,
  Pencil,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TestStats = {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  avgScore?: number;
};

type TestWithStats = Test & { stats: TestStats };

function shortDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function TestActionsMenu({
  test,
  onDelete,
}: {
  test: TestWithStats;
  onDelete: (test: TestWithStats) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/tests/${test.id}`}>
            <a className="flex items-center cursor-pointer">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </a>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/tests/${test.id}/edit`}>
            <a className="flex items-center cursor-pointer">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Test
            </a>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ExternalLink className="h-4 w-4 mr-2" />
          Invite Candidate
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(e) => {
            e.preventDefault();
            onDelete(test);
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Test
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileTestCard({
  test,
  onDelete,
  showActiveBadge,
}: {
  test: TestWithStats;
  onDelete: (test: TestWithStats) => void;
  showActiveBadge?: boolean;
}) {
  const isActive = test.stats.pending > 0 || test.stats.inProgress > 0;

  return (
    <div className="px-3 py-3.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 pr-1">
          <Link href={`/tests/${test.id}`}>
            <a className="block">
              <p className="text-sm font-medium text-primary line-clamp-2 leading-snug">
                {test.title}
              </p>
            </a>
          </Link>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {showActiveBadge ? (
            <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-5">
              {test.stats.inProgress} active
            </Badge>
          ) : (
            <Badge
              variant={isActive ? "success" : "outline"}
              className="text-[10px] px-1.5 py-0 h-5"
            >
              {isActive ? "Active" : "Idle"}
            </Badge>
          )}
          <TestActionsMenu test={test} onDelete={onDelete} />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {shortDuration(test.duration)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {test.stats.total} invited
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="h-3.5 w-3.5" />
          {test.stats.completed} done
        </span>
      </div>

      {(test.stats.inProgress > 0 || test.stats.pending > 0) && !showActiveBadge && (
        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
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
      )}
    </div>
  );
}

function TestsEmpty({
  searchQuery,
}: {
  searchQuery: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? (
              <>No tests found matching "<strong>{searchQuery}</strong>"</>
            ) : (
              "You haven't created any tests yet."
            )}
          </p>
          {!searchQuery && (
            <Button asChild size="sm">
              <Link href="/tests/create">
                <Plus className="h-4 w-4 mr-1.5" />
                Create Your First Test
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestsIndex() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [testToDelete, setTestToDelete] = useState<TestWithStats | null>(null);
  const queryClient = useQueryClient();

  const { data: tests, isLoading } = useQuery<TestWithStats[]>({
    queryKey: ["/api/tests"],
    enabled: !!user,
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (testId: number) => {
      await apiRequest("DELETE", `/api/tests/${testId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      setTestToDelete(null);
      toast({ title: "Test deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete test",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const filteredTests = tests
    ? [...tests]
        .filter((test) =>
          test.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        )
    : undefined;

  const activeTests = filteredTests?.filter((test) => test.stats.inProgress > 0);

  const renderList = (list: TestWithStats[] | undefined, opts?: { activeOnly?: boolean }) => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6 text-sm text-muted-foreground">Loading tests...</div>
          </CardContent>
        </Card>
      );
    }

    if (!list?.length) {
      if (opts?.activeOnly) {
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No active tests found.</p>
              </div>
            </CardContent>
          </Card>
        );
      }
      return <TestsEmpty searchQuery={searchQuery} />;
    }

    return (
      <Card>
        <CardContent className="p-0">
          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-border">
            {list.map((test) => (
              <li key={test.id}>
                <MobileTestCard
                  test={test}
                  onDelete={setTestToDelete}
                  showActiveBadge={opts?.activeOnly}
                />
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>{opts?.activeOnly ? "Active Candidates" : "Candidates"}</TableHead>
                  {!opts?.activeOnly && <TableHead>Completion</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      <Link href={`/tests/${test.id}`}>
                        <a className="text-primary hover:underline">{test.title}</a>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
                        {formatDuration(test.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {opts?.activeOnly ? (
                        <Badge variant="warning">{test.stats.inProgress} in progress</Badge>
                      ) : (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1.5 text-muted-foreground" />
                          {test.stats.total} sent
                        </div>
                      )}
                    </TableCell>
                    {!opts?.activeOnly && (
                      <TableCell>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1.5 text-muted-foreground" />
                          {test.stats.completed} / {test.stats.total}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {opts?.activeOnly ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/tests/${test.id}`}>
                            <Eye className="h-4 w-4 mr-1.5" />
                            View
                          </Link>
                        </Button>
                      ) : (
                        <TestActionsMenu test={test} onDelete={setTestToDelete} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageShell
      title="Tests"
      subtitle="Manage and monitor your assessments"
      action={
        <Button asChild>
          <Link href="/tests/create">
            <Plus className="h-4 w-4" />
            Create Test
          </Link>
        </Button>
      }
    >
      <div className="mb-3 sm:mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tests..."
            className="pl-8 h-9 sm:h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-3 sm:mb-4 w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-9">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All Tests</TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm">Active</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {renderList(filteredTests)}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {renderList(activeTests, { activeOnly: true })}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!testToDelete}
        onOpenChange={(open) => !open && setTestToDelete(null)}
      >
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete test?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{testToDelete?.title}&quot; and all
              its questions and candidate data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={deleteTestMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTestMutation.isPending}
              onClick={() =>
                testToDelete && deleteTestMutation.mutate(testToDelete.id)
              }
            >
              {deleteTestMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
