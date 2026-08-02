import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Copy,
  Mail,
  Eye,
  ClipboardList,
  Users,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type CandidateRow = {
  id: number;
  name: string;
  email: string;
  status: string;
  score?: number;
  passingScore?: number;
  testTitle: string;
  testId: number;
  testLink: string;
  invitedAt: string;
  startedAt?: string;
  completedAt?: string;
};

type TabFilter = "all" | "completed" | "in_progress" | "pending";

function compactDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function statusBadge(status: string) {
  if (status === "completed") {
    return <Badge variant="success" className="text-[10px] sm:text-xs px-1.5 py-0 h-5">Completed</Badge>;
  }
  if (status === "in_progress") {
    return <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0 h-5">In Progress</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0 h-5">Pending</Badge>;
}

function scoreBadge(score?: number, passingScore?: number) {
  const pass = passingScore ?? 70;
  const value = score ?? 0;
  return (
    <Badge
      variant={value >= pass ? "success" : "destructive"}
      className="text-[10px] sm:text-xs px-1.5 py-0 h-5"
    >
      {value}%
    </Badge>
  );
}

function MobileCandidateCard({
  candidate,
  onCopy,
  onMail,
  mode,
}: {
  candidate: CandidateRow;
  onCopy: (link: string) => void;
  onMail: (c: CandidateRow) => void;
  mode: TabFilter;
}) {
  const metaDate =
    mode === "completed"
      ? candidate.completedAt
      : mode === "in_progress"
        ? candidate.startedAt
        : candidate.invitedAt;

  const metaLabel =
    mode === "completed"
      ? "Done"
      : mode === "in_progress"
        ? "Started"
        : "Invited";

  return (
    <div className="px-3 py-3.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{candidate.name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{candidate.email}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {mode === "completed"
            ? scoreBadge(candidate.score, candidate.passingScore)
            : statusBadge(candidate.status)}
        </div>
      </div>

      <Link href={`/tests/${candidate.testId}`}>
        <a className="block text-xs text-primary truncate hover:underline">
          {candidate.testTitle}
        </a>
      </Link>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {metaLabel} {compactDate(metaDate)}
        </p>
        <div className="flex items-center shrink-0">
          {mode === "completed" || mode === "in_progress" ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" asChild>
              <Link href={`/tests/${candidate.testId}`}>
                <Eye className="h-3.5 w-3.5 mr-1" />
                View
              </Link>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onCopy(candidate.testLink)}
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="sr-only">Copy link</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onMail(candidate)}
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="sr-only">Send email</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CandidatesIndex() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: candidates = [], isLoading } = useQuery<CandidateRow[]>({
    queryKey: ["/api/candidates"],
    enabled: !!user,
  });

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.testTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyTestLink = (testLink: string) => {
    const url = `${window.location.origin}/take-test/${testLink}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Test link has been copied to clipboard",
    });
  };

  const mailCandidate = (candidate: CandidateRow) => {
    window.open(
      `mailto:${candidate.email}?subject=Invitation to take a coding test&body=Please take the test at ${window.location.origin}/take-test/${candidate.testLink}`,
      "_blank"
    );
  };

  if (!user) return null;

  const byStatus = (status: string) =>
    filteredCandidates.filter((c) => c.status === status);

  const renderList = (list: CandidateRow[], mode: TabFilter, emptyMsg: string) => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6 text-sm text-muted-foreground">
              Loading candidates...
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!list.length) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                {mode === "all" && searchQuery ? (
                  <>No candidates found matching "<strong>{searchQuery}</strong>"</>
                ) : (
                  emptyMsg
                )}
              </p>
              {mode === "all" && !searchQuery && (
                <Button asChild size="sm">
                  <Link href="/tests">
                    <Users className="h-4 w-4 mr-1.5" />
                    Invite Candidates
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-0">
          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-border">
            {list.map((candidate) => (
              <li key={candidate.id}>
                <MobileCandidateCard
                  candidate={candidate}
                  onCopy={copyTestLink}
                  onMail={mailCandidate}
                  mode={mode}
                />
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Test</TableHead>
                  {mode === "completed" ? (
                    <>
                      <TableHead>Score</TableHead>
                      <TableHead>Completed</TableHead>
                    </>
                  ) : mode === "in_progress" ? (
                    <TableHead>Started</TableHead>
                  ) : mode === "pending" ? (
                    <TableHead>Invited</TableHead>
                  ) : (
                    <>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{candidate.name}</TableCell>
                    <TableCell>{candidate.email}</TableCell>
                    <TableCell>
                      <Link href={`/tests/${candidate.testId}`}>
                        <a className="text-primary hover:underline">{candidate.testTitle}</a>
                      </Link>
                    </TableCell>
                    {mode === "completed" ? (
                      <>
                        <TableCell>
                          {scoreBadge(candidate.score, candidate.passingScore)}
                        </TableCell>
                        <TableCell>{formatDate(candidate.completedAt)}</TableCell>
                      </>
                    ) : mode === "in_progress" ? (
                      <TableCell>{formatDate(candidate.startedAt)}</TableCell>
                    ) : mode === "pending" ? (
                      <TableCell>{formatDate(candidate.invitedAt)}</TableCell>
                    ) : (
                      <>
                        <TableCell>{statusBadge(candidate.status)}</TableCell>
                        <TableCell>{formatDate(candidate.invitedAt)}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right">
                      {mode === "completed" || mode === "in_progress" ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/tests/${candidate.testId}`}>
                            <Eye className="h-4 w-4 mr-1.5" />
                            View
                          </Link>
                        </Button>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyTestLink(candidate.testLink)}
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy link</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => mailCandidate(candidate)}
                          >
                            <Mail className="h-4 w-4" />
                            <span className="sr-only">Send email</span>
                          </Button>
                        </div>
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
      title="Candidates"
      subtitle="Track invitations and test progress"
      action={
        <Button variant="outline" asChild>
          <Link href="/tests">
            <ClipboardList className="h-4 w-4" />
            View Tests
          </Link>
        </Button>
      }
    >
      <div className="mb-3 sm:mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search candidates..."
            className="pl-8 h-9 sm:h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-3 sm:mb-4 w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-auto sm:h-9 p-1 gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm h-8">
            All
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm h-8">
            Completed
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="text-xs sm:text-sm h-8">
            In Progress
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs sm:text-sm h-8">
            Pending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {renderList(filteredCandidates, "all", "No candidates have been invited yet.")}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {renderList(byStatus("completed"), "completed", "No candidates have completed tests yet.")}
        </TabsContent>

        <TabsContent value="in-progress" className="mt-0">
          {renderList(byStatus("in_progress"), "in_progress", "No candidates are currently taking tests.")}
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          {renderList(byStatus("pending"), "pending", "No pending invitations found.")}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
