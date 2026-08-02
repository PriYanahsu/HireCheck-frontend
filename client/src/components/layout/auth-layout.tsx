import { useEffect, useRef, type ReactNode } from "react";
import { Layers, CheckCircle2, BarChart3, Users } from "lucide-react";

type AuthLayoutProps = {
  children: ReactNode;
};

const features = [
  { icon: CheckCircle2, text: "Auto-submit when time runs out" },
  { icon: BarChart3, text: "Real-time candidate analytics" },
  { icon: Users, text: "Invite and track unlimited candidates" },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const scrollFieldIntoView = (el: HTMLElement) => {
      // Wait for keyboard / visualViewport to settle
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }, 280);
    };

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.tagName !== "INPUT" && t.tagName !== "TEXTAREA") return;
      scrollFieldIntoView(t);
    };

    // iOS often doesn't resize layout for keyboard — pad the scroll area so the form can move up
    const vv = window.visualViewport;
    const syncKeyboardInset = () => {
      if (!vv) {
        root.style.paddingBottom = "";
        return;
      }
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.paddingBottom = `${Math.max(32, inset + 24)}px`;
    };

    root.addEventListener("focusin", onFocusIn);
    vv?.addEventListener("resize", syncKeyboardInset);
    vv?.addEventListener("scroll", syncKeyboardInset);
    syncKeyboardInset();

    return () => {
      root.removeEventListener("focusin", onFocusIn);
      vv?.removeEventListener("resize", syncKeyboardInset);
      vv?.removeEventListener("scroll", syncKeyboardInset);
      root.style.paddingBottom = "";
    };
  }, []);

  return (
    <div className="h-dvh max-h-dvh flex overflow-hidden">
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

      <div
        ref={scrollRef}
        className="app-scroll app-main flex min-h-0 flex-1 flex-col px-5 pt-8 sm:px-6 sm:py-12 lg:px-8"
      >
        <div className="mx-auto my-auto w-full max-w-sm sm:max-w-md">
          <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-foreground">HireCheck</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
