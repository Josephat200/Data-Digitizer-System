import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetMe } from "@workspace/api-client-react";
import { 
  LayoutDashboard, Users, FileText, ClipboardList, 
  Baby, FileX, Activity, ListChecks, LogOut, ChevronRight
} from "lucide-react";
import { Button } from "./ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [location] = useLocation();
  const { data: user } = useGetMe();

  const isAdmin = user?.role === "data_manager";

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Screening", href: "/screening", icon: Users },
    { label: "Enrolment", href: "/enrolment", icon: ClipboardList },
    { label: "ANC Visits", href: "/anc", icon: Activity },
    { label: "Deliveries", href: "/delivery", icon: Baby },
    { label: "Closeouts", href: "/closeout", icon: FileX },
    ...(isAdmin ? [
      { label: "Audit Log", href: "/audit", icon: ListChecks },
      { label: "Data Quality", href: "/reports", icon: FileText },
    ] : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Watermark – hidden on screen, appears on every printed page */}
      <div className="kemri-watermark" aria-hidden="true">KEMRI&nbsp;&nbsp;CGHR</div>

      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground shadow-sm z-10">
        <div className="p-4 border-b border-sidebar-border/50">
          <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
            <Activity className="w-6 h-6" />
            <span>KEMRI-CGHR</span>
          </div>
          <p className="text-xs text-sidebar-foreground/70 mt-1 font-medium">Influenza Program CDMS</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-xs font-semibold text-sidebar-foreground/50 mb-2 uppercase tracking-wider px-2">Menu</div>
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/50 bg-sidebar-accent/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-primary/30 shadow-sm">
              {user?.initials || "??"}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold truncate text-sidebar-foreground">{user?.fullName || "Loading..."}</div>
              <div className="text-xs text-sidebar-foreground/70 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Role"}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 border-b bg-background flex items-center px-6 shadow-sm z-0">
          <div className="flex items-center text-sm text-muted-foreground font-medium">
            <span>KEMRI-CGHR</span>
            <ChevronRight className="w-4 h-4 mx-1 opacity-50" />
            <span className="text-foreground">{navItems.find(i => location.startsWith(i.href))?.label || "Page"}</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 bg-muted/10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
