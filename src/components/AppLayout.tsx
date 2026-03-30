import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

export const AppLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar – hidden below lg */}
      <DesktopSidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 h-screen">
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>

        {/* Mobile bottom nav – hidden at lg and above */}
        <BottomNav />
      </div>
    </div>
  );
};
