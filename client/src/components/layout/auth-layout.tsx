import { Layers, CheckCircle2, BarChart3, Users } from "lucide-react";

type AuthLayoutProps = {
  children: React.ReactNode;
};

const features = [
  { icon: CheckCircle2, text: "Auto-submit when time runs out" },
  { icon: BarChart3, text: "Real-time candidate analytics" },
  { icon: Users, text: "Invite and track unlimited candidates" },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div className="auth-panel text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">HireCheck</span>
          </div>
          <h2 className="mt-12 text-3xl font-bold leading-tight">
            Hire smarter with
            <br />
            <span className="text-violet-300">technical assessments</span>
          </h2>
          <p className="mt-4 text-sm text-white/70 max-w-sm leading-relaxed">
            Create coding tests, invite candidates, and review results — all in one place.
          </p>
        </div>

        <ul className="space-y-4">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-white/80">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 app-main">
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-foreground">HireCheck</span>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
