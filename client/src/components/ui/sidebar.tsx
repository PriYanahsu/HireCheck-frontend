import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  BarChart,
  FileQuestion,
  Layers,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SidebarItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

const mainNavItems: SidebarItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: "Tests", href: "/tests", icon: <FileQuestion className="h-4 w-4" /> },
  { title: "Candidates", href: "/candidates", icon: <Users className="h-4 w-4" /> },
  { title: "Analytics", href: "/analytics", icon: <BarChart className="h-4 w-4" /> },
];

const Sidebar = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navLink = (item: SidebarItem) => {
    const isActive = location === item.href;
    return (
      <Link key={item.href} href={item.href}>
        <a
          className={cn(
            "group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {item.icon}
          {item.title}
        </a>
      </Link>
    );
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-full overflow-hidden bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-3 h-16 shrink-0 px-5 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Layers className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">HireCheck</span>
      </div>

      <nav className="flex-1 min-h-0 px-3 py-5 overflow-y-auto">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Overview
        </p>
        <div className="space-y-1">{mainNavItems.map(navLink)}</div>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-border">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name}&background=3b6cf5&color=fff`} />
            <AvatarFallback className="bg-muted text-xs">{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.company || user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
