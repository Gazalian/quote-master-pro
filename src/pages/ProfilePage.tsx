import { User, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
      toast.success("Successfully signed out");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 py-6 md:p-8 bg-card shrink-0 border-b border-border/50">
        <h1 className="text-2xl font-bold text-foreground">Settings & Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account and preferences</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-3xl">
        {/* Avatar & name */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 bg-card rounded-2xl border border-border">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <User size={36} className="text-primary" />
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0">
            <p className="font-bold text-xl text-foreground truncate">
              {user?.email || "User Profile"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Free Tier · Account active</p>
          </div>
        </div>

        {/* Points balance */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-primary/20">
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider mb-1">Available Points</p>
            <p className="text-primary-foreground text-4xl font-black">47</p>
            <p className="text-primary-foreground/80 text-xs mt-2 font-medium bg-black/10 inline-block px-2 py-1 rounded-md">
              Usage: 3 pts / quote · 2 pts / PDF
            </p>
          </div>
          <button className="bg-background text-primary px-6 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-background/90 transition-colors whitespace-nowrap">
            Buy Points
          </button>
        </div>

        {/* Menu items */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest pl-2 mb-3">Preferences</h3>
          <MenuItem label="Account Information" />
          <MenuItem label="Trade Type" value="Electrician" />
          <MenuItem label="Purchase History" />
          <MenuItem label="Notification Settings" />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest pl-2 mb-3">Support</h3>
          <MenuItem label="Help & Support" />
          <MenuItem label="About OtoQuote" />
        </div>

        <div className="pt-4 border-t border-border/50">
          <button 
            onClick={handleSignOut}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
        <div className="h-8 md:hidden" />
      </div>
    </div>
  );
};

const MenuItem = ({ label, value }: { label: string; value?: string }) => (
  <button className="w-full flex items-center justify-between bg-card hover:bg-secondary/50 transition-colors rounded-xl px-4 py-4 border border-border group cursor-pointer">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{value}</span>}
      <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
    </div>
  </button>
);

export default ProfilePage;
