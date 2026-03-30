import { useState, useEffect } from "react";
import { User, ChevronRight, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    trade_type: "",
    state_operation: "",
  });

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          trade_type: data.trade_type || "",
          state_operation: data.state_operation || "",
        });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
         full_name: formData.full_name,
         trade_type: formData.trade_type,
         state_operation: formData.state_operation,
      }).eq('id', user.id);
      
      if (error) throw error;
      toast.success("Profile updated");
      setIsEditing(false);
      await fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

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
              {profile?.full_name || user?.email || "User Profile"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Free Tier · Account active</p>
          </div>
        </div>

        {/* Points balance */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-primary/20">
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider mb-1">Available Points</p>
            <p className="text-primary-foreground text-4xl font-black">{profile?.points ?? 0}</p>
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
          <div className="flex justify-between items-center mb-3 pr-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest pl-2">Preferences</h3>
            <button onClick={() => setIsEditing(!isEditing)} className="text-primary text-xs font-bold hover:underline">
               {isEditing ? "Cancel" : "Edit Details"}
            </button>
          </div>
          
          {isEditing ? (
             <div className="bg-card p-5 rounded-2xl border border-border space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</label>
                  <input 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                    className="w-full mt-1 bg-secondary text-foreground p-3 rounded-xl border border-transparent focus:border-primary outline-none transition-colors" 
                    placeholder="Enter your name" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trade / Profession</label>
                  <input 
                    value={formData.trade_type} 
                    onChange={(e) => setFormData({...formData, trade_type: e.target.value})} 
                    className="w-full mt-1 bg-secondary text-foreground p-3 rounded-xl border border-transparent focus:border-primary outline-none transition-colors" 
                    placeholder="E.g. Electrician, Plumber" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">State of Operation</label>
                  <input 
                    value={formData.state_operation} 
                    onChange={(e) => setFormData({...formData, state_operation: e.target.value})} 
                    className="w-full mt-1 bg-secondary text-foreground p-3 rounded-xl border border-transparent focus:border-primary outline-none transition-colors" 
                    placeholder="E.g. Lagos, Abuja" 
                  />
                </div>
                <button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
                </button>
             </div>
          ) : (
            <>
              <MenuItem label="Full Name" value={profile?.full_name || "Not set"} />
              <MenuItem label="Trade Type" value={profile?.trade_type || "Not set"} />
              <MenuItem label="State" value={profile?.state_operation || "Not set"} />
            </>
          )}
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
