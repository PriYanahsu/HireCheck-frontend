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

        <main className="flex-1 min-h-0 overflow-y-auto app-main pt-16 lg:pt-0">
          <div className="page-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
