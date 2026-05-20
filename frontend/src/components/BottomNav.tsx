import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, FileText, BookOpen, Palette, User } from "lucide-react";

const navItems = [
  { path: "/chat",     label: "Chat",      icon: MessageSquare },
  { path: "/quotes",   label: "Quotes",    icon: FileText },
  { path: "/pricelog", label: "Price Log", icon: BookOpen },
  { path: "/brand",    label: "Brand",     icon: Palette },
  { path: "/profile",  label: "Profile",   icon: User },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking    = useRef(false);

  useEffect(() => {
    // Capture-phase listener catches scroll events from ANY scroll container
    // in the document without needing to modify individual pages.
    const onScroll = (e: Event) => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const target = e.target as HTMLElement;
        // Use scrollTop for element scrolls, scrollY for window scroll
        const currentY = "scrollTop" in target ? target.scrollTop : window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (delta > 6 && currentY > 60) {
          // Scrolling down — hide nav
          setVisible(false);
        } else if (delta < -6) {
          // Scrolling up — show nav
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  // Always show nav when route changes (e.g. tapping a tab)
  useEffect(() => {
    setVisible(true);
    lastScrollY.current = 0;
  }, [location.pathname]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-transform duration-300 ease-in-out"
      style={{
        transform: visible ? "translateY(0)" : "translateY(100%)",
        // Respect iPhone home-bar / notch safe area
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "hsl(var(--nav-bg, var(--background)))",
        borderTop: "1px solid hsl(var(--border))",
      }}
    >
      <div className="flex items-center justify-around h-16">
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
      </div>
    </nav>
  );
};
