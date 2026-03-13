import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      <div className="flex-1 overflow-hidden">{children}</div>
      <BottomNav />
    </div>
  );
};
