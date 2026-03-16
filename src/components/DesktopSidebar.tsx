import { NavLink, useLocation } from "react-router-dom";
import { MessageSquare, LayoutList, Calculator, Paintbrush, User, Zap } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export const DesktopSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const links = [
    { to: "/chat", icon: MessageSquare, label: "New Quote" },
    { to: "/quotes", icon: LayoutList, label: "Quotations" },
    { to: "/pricelog", icon: Calculator, label: "Price Log" },
    { to: "/brand", icon: Paintbrush, label: "Brand" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[280px] bg-card border-r border-border h-screen sticky top-0">
      {/* App Logo / Header */}
      <div className="p-6 flex items-center gap-3 border-b border-border/50">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <Zap className="w-6 h-6 text-primary fill-primary/20" />
        </div>
        <div>
          <h1 className="font-bold text-foreground leading-tight">OtoQuote</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
            AI Quotation Engine
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }
              `}
            >
              <link.icon
                className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {link.label}
            </NavLink>
          );
        })}
        
        {/* Profile Link (Separated slightly from main nav) */}
        <div className="pt-4 mt-4 border-t border-border/50">
           <NavLink
              to="/profile"
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  location.pathname === "/profile"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }
              `}
            >
              <User
                className={`w-5 h-5 ${location.pathname === "/profile" ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={location.pathname === "/profile" ? 2.5 : 2}
              />
              Profile
            </NavLink>
        </div>
      </nav>

      {/* User Section (Bottom) */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 pr-2">
            <p className="font-semibold text-sm text-foreground truncate">
              {user?.email || "Signed In User"}
            </p>
            <p className="text-xs text-muted-foreground">Free Tier</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
