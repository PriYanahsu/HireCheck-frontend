import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Layers } from "lucide-react";

export default function CandidateComplete() {
  useEffect(() => {
    // Add logic here if needed to check if this page was properly accessed
  }, []);

  const completedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="h-dvh max-h-dvh app-scroll flex flex-col items-center justify-center app-main px-4 py-12">
      <Card className="w-full max-w-md surface-card shadow-md">
        <CardContent className="pt-10 pb-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight">
            Test Submitted!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your answers have been recorded and will be reviewed by the recruiter.
          </p>

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium">{completedDate}</span>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            The recruiting team will review your submission and get back to you soon.
          </p>
        </CardContent>
      </Card>

      <p className="mt-8 flex items-center gap-1.5 text-sm text-muted-foreground">
        Powered by
        <span className="font-semibold text-primary flex items-center gap-1">
          <Layers className="h-4 w-4" />
          HireCheck
        </span>
      </p>
    </div>
  );
}
