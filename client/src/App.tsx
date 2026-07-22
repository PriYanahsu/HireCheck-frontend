import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import Dashboard from "@/pages/dashboard";
import TestsIndex from "@/pages/tests/index";
import CreateTest from "@/pages/tests/create";
import EditTest from "@/pages/tests/edit";
import ViewTest from "@/pages/tests/view";
import CandidatesIndex from "@/pages/candidates/index";
import AnalyticsIndex from "@/pages/analytics/index";
import CandidateTest from "@/pages/candidate/test";
import CandidateComplete from "@/pages/candidate/complete";
import PublicTestPage from "@/pages/public-test/[testId]";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      {/* Agency Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/tests" component={TestsIndex} />
      <Route path="/tests/create" component={CreateTest} />
      <Route path="/tests/:id/edit" component={EditTest} />
      <Route path="/tests/:id" component={ViewTest} />
      <Route path="/candidates" component={CandidatesIndex} />
      <Route path="/analytics" component={AnalyticsIndex} />
      
      {/* Candidate Routes */}
      <Route path="/take-test/:testLink" component={CandidateTest} />
      <Route path="/test-complete" component={CandidateComplete} />
      <Route path="/public-test/:testId" component={PublicTestPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // const [isMobileBlocked, setIsMobileBlocked] = useState(false);

  // useEffect(() => {
  //   const checkMobileDevice = () => {
  //     const isNarrowScreen = window.matchMedia("(max-width: 820px)").matches;
  //     const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  //     setIsMobileBlocked(isNarrowScreen || isMobileUserAgent);
  //   };

  //   checkMobileDevice();
  //   window.addEventListener("resize", checkMobileDevice);

  //   return () => {
  //     window.removeEventListener("resize", checkMobileDevice);
  //   };
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {/* {isMobileBlocked ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-6 text-center">
              <div className="max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
                <h1 className="text-xl font-semibold">Desktop Only</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  This platform is restricted on mobile devices. Please open it on a laptop
                  or a bigger screen to continue.
                </p>
              </div>
            </div>
          ) : ( */}
            <Router />
          {/* //  )}  */}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
