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
      <CardHeader>
        <CardTitle className="text-base font-medium">Pending Invites</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1 px-4 pb-4">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-2.5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="ml-3 flex-1 space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))
          ) : error ? (
            <p className="text-sm text-destructive p-2">Failed to load invites</p>
          ) : candidates && candidates.length > 0 ? (
            candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center p-2.5 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <Avatar className="h-9 w-9 rounded-full">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {candidate.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{candidate.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{candidate.testTitle}</p>
                </div>
                <div className="ml-2 text-xs text-muted-foreground shrink-0">
                  {getRelativeTime(candidate.invitedAt)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No pending invitations
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PendingInvites;
