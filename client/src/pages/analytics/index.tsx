import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from "@/components/dashboard/stats-card";
import { Percent, Target, TrendingUp } from "lucide-react";

type Candidate = {
  id: number;
  status: string;
  score?: number;
  passingScore?: number;
  testTitle: string;
};

type TestWithStats = {
  id: number;
  title: string;
  stats: {
    total: number;
    completed: number;
    avgScore?: number;
  };
};

const chartConfig = {
  score: { label: "Avg Score", color: "hsl(221 83% 53%)" },
};

export default function AnalyticsIndex() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
    enabled: !!user,
  });

  const { data: tests = [], isLoading: testsLoading } = useQuery<TestWithStats[]>({
    queryKey: ["/api/tests"],
    enabled: !!user,
  });

  const completed = useMemo(
    () => candidates.filter((c) => c.status === "completed" && c.score != null),
    [candidates]
  );

  const passRate = useMemo(() => {
    if (completed.length === 0) return 0;
    const passed = completed.filter(
      (c) => c.score! >= (c.passingScore ?? 70)
    ).length;
    return Math.round((passed / completed.length) * 100);
  }, [completed]);

  const avgScore = useMemo(() => {
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, c) => sum + (c.score ?? 0), 0);
    return Math.round(total / completed.length);
  }, [completed]);

  const chartData = useMemo(
    () =>
      tests
        .filter((t) => t.stats.completed > 0 && (t.stats.avgScore ?? 0) > 0)
        .map((t) => ({
          name: t.title.length > 20 ? t.title.slice(0, 20) + "…" : t.title,
          score: Math.round(t.stats.avgScore ?? 0),
        })),
    [tests]
  );

  const testBreakdown = useMemo(
    () =>
      tests.map((t) => {
        const testCandidates = candidates.filter(
          (c) => c.testTitle === t.title && c.status === "completed"
        );
        const passed = testCandidates.filter(
          (c) => (c.score ?? 0) >= (c.passingScore ?? 70)
        ).length;
        const rate =
          testCandidates.length > 0
            ? Math.round((passed / testCandidates.length) * 100)
            : 0;
        return {
          id: t.id,
          title: t.title,
          sent: t.stats.total,
          completed: t.stats.completed,
          avgScore: Math.round(t.stats.avgScore ?? 0),
          passRate: rate,
        };
      }),
    [tests, candidates]
  );

  const isLoading = candidatesLoading || testsLoading;

  if (!user) return null;

  return (
    <PageShell
      title="Analytics"
      subtitle="Performance insights across your assessments"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatsCard
              title="Overall Pass Rate"
              value={passRate}
              icon={<Target className="h-6 w-6" />}
              accentColor="border-l-emerald-500"
            />
            <StatsCard
              title="Average Score"
              value={avgScore}
              icon={<TrendingUp className="h-6 w-6" />}
              accentColor="border-l-indigo-500"
            />
            <StatsCard
              title="Completion Rate"
              value={
                candidates.length > 0
                  ? Math.round((completed.length / candidates.length) * 100)
                  : 0
              }
              icon={<Percent className="h-6 w-6" />}
              accentColor="border-l-amber-500"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Avg Score by Test</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-48 w-full">
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="score" fill="var(--color-score)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                No completed assessments to chart yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Per-Test Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : testBreakdown.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Done</TableHead>
                    <TableHead className="text-right">Avg</TableHead>
                    <TableHead className="text-right">Pass %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testBreakdown.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium max-w-[160px] truncate">
                        {row.title}
                      </TableCell>
                      <TableCell className="text-right">{row.sent}</TableCell>
                      <TableCell className="text-right">{row.completed}</TableCell>
                      <TableCell className="text-right">{row.avgScore}%</TableCell>
                      <TableCell className="text-right">{row.passRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                No tests created yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
