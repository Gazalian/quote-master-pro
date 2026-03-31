import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

export const AppLayout = () => {
  return (
    <div className="flex h-app bg-background">
      {/* Desktop sidebar – hidden below lg */}
      <DesktopSidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>

        {/* Spacer that reserves space for the fixed BottomNav on mobile.
            Prevents page content from being hidden behind the nav. */}
        <div
          className="shrink-0 lg:hidden"
          style={{ height: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
        />
      </div>

      {/* Fixed bottom nav — rendered outside the scroll flow */}
      <BottomNav />
    </div>
  );
};
