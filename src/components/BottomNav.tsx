import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, FileText, BookOpen, Palette, User } from "lucide-react";

const navItems = [
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/quotes", label: "Quotes", icon: FileText },
  { path: "/pricelog", label: "Price Log", icon: BookOpen },
  { path: "/brand", label: "Brand", icon: Palette },
  { path: "/profile", label: "Profile", icon: User },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-around bg-nav-bg border-t border-border h-16 shrink-0 lg:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] transition-colors ${
              isActive ? "text-nav-active" : "text-nav-inactive"
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
