import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getRelativeTime } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

type Candidate = {
  id: number;
  name: string;
  testId: number;
  testTitle: string;
  status: string;
  invitedAt: string;
};

export function PendingInvites() {
  const { data: candidates, isLoading, error } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates?status=pending"],
    select: (data) => data.slice(0, 5),
  });

  return (
    <Card className="h-full">
      <CardHeader className="px-3 py-2.5 sm:p-6 sm:pb-4">
        <CardTitle className="text-[13px] sm:text-base font-medium">Pending Invites</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0 px-2 pb-2 sm:px-4 sm:pb-4">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-1.5 sm:p-2">
                <Skeleton className="h-7 w-7 sm:h-9 sm:w-9 rounded-full" />
                <div className="ml-2 flex-1 space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-32" />
                </div>
              </div>
            ))
          ) : error ? (
            <p className="text-xs text-destructive p-2">Failed to load invites</p>
          ) : candidates && candidates.length > 0 ? (
            candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center px-1.5 py-1.5 sm:p-2 hover:bg-muted/50 rounded-md transition-colors"
              >
                <Avatar className="h-7 w-7 sm:h-9 sm:w-9 rounded-full">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] sm:text-xs font-medium">
                    {candidate.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-2 min-w-0 flex-1">
                  <p className="text-[12px] sm:text-sm font-medium truncate leading-tight">
                    {candidate.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate leading-tight mt-0.5">
                    {candidate.testTitle}
                  </p>
                </div>
                <div className="ml-2 text-[9px] sm:text-xs text-muted-foreground shrink-0">
                  {getRelativeTime(candidate.invitedAt)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-4 sm:py-6">
              No pending invitations
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PendingInvites;
