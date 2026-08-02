import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  FileQuestion,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
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

const MobileSidebar = () => {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navLink = (item: SidebarItem) => {
    const isActive = location === item.href;
    return (
      <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
        <a
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
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
    <>
      {/* Outside Sheet so `fixed` is always viewport-relative */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div className="flex items-center justify-between h-full px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <span className="text-base font-bold">HireCheck</span>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <div className="flex items-center gap-2 h-14 px-5 border-b">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold">HireCheck</span>
              </div>

              <nav className="px-3 py-5 space-y-1">{mainNavItems.map(navLink)}</nav>

              <div className="absolute bottom-0 left-0 right-0 border-t p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://ui-avatars.com/api/?name=${user?.name}&background=3b6cf5&color=fff`}
                    />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.company || user?.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
};

export default MobileSidebar;
