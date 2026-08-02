import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";

type PageShellProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function PageShell({ title, subtitle, action, children }: PageShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <MobileSidebar />

      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <header className="page-header">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {action}
        </header>

        <main className="app-scroll flex-1 min-h-0 app-main pt-14 lg:pt-0">
          <div className="page-content">
            <div className="lg:hidden flex items-center justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold tracking-tight text-foreground leading-tight">{title}</h1>
                {subtitle && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate leading-snug">{subtitle}</p>
                )}
              </div>
              {action && (
                <div className="shrink-0 [&_button]:h-7 [&_button]:text-[11px] [&_button]:px-2 [&_a]:h-7 [&_a]:text-[11px] [&_a]:px-2">
                  {action}
                </div>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
