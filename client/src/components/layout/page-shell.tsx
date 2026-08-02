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
    <div className="h-screen overflow-hidden flex">
      <Sidebar />
      <MobileSidebar />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="page-header">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {action}
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto app-main pt-14 lg:pt-0">
          <div className="page-content">
            <div className="lg:hidden flex items-center justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
              {action && <div className="shrink-0 [&_button]:h-8 [&_button]:text-xs [&_button]:px-2.5 [&_a]:h-8 [&_a]:text-xs [&_a]:px-2.5">{action}</div>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
