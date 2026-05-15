import { useEffect, useState } from "react";
import { LogOut, Loader2, Pencil, Check, X, HelpCircle, Info, Zap } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const TRADE_TYPES = [
  "Electrician",
  "Plumber",
  "Builder / Mason",
  "Painter",
  "Carpenter",
  "Tiler",
  "Welder / Fabricator",
  "AC / Refrigeration Technician",
  "Generator Technician",
  "Borehole Driller",
  "Other",
];

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm";

const selectClass =
  "w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm appearance-none cursor-pointer";

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: bootstrap, isLoading: loadingProfile } = useBootstrap();
  const updateProfile = useUpdateProfile();
  const profile = bootstrap?.profile ?? null;
  const isSaving = updateProfile.isPending;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    trade_type: "",
    state_operation: "",
  });

  // Sync form once when the cached profile arrives / changes.
  useEffect(() => {
    if (!profile) return;
    setFormData({
      full_name: profile.full_name || "",
      trade_type: profile.trade_type || "",
      state_operation: profile.state_operation || "",
    });
  }, [profile?.id, profile?.full_name, profile?.trade_type, profile?.state_operation]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: formData.full_name,
        trade_type: formData.trade_type,
        state_operation: formData.state_operation,
      });
      toast.success("Profile updated");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      full_name: profile?.full_name || "",
      trade_type: profile?.trade_type || "",
      state_operation: profile?.state_operation || "",
    });
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

  // Initials for avatar
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .slice(0, 2)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  if (loadingProfile) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-4 py-5 md:px-8 md:py-6 bg-card border-b border-border/50 shrink-0">
          <h1 className="text-xl font-bold text-foreground">Profile & Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your account details</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Page Header */}
      <div className="px-4 py-5 md:px-8 md:py-6 bg-card border-b border-border/50 shrink-0">
        <h1 className="text-xl font-bold text-foreground">Profile & Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account details</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5 max-w-2xl">
        {/* ── Avatar card ── */}
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-md">
            <span className="text-primary-foreground font-bold text-xl">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg text-foreground truncate">
              {profile?.full_name || "Your Name"}
            </p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            {profile?.trade_type && (
              <span className="inline-block mt-1.5 text-xs font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                {profile.trade_type}
              </span>
            )}
          </div>
        </div>

        {/* ── Points balance ── */}
        <div className="bg-gradient-to-br from-[#0056D2] to-[#003fa3] rounded-2xl p-5 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                Available Points
              </p>
              <p className="text-white text-5xl font-black leading-none">
                {profile?.points ?? 0}
              </p>
              <div className="flex gap-3 mt-3">
                <span className="text-white/80 text-[11px] bg-white/10 px-2.5 py-1 rounded-lg font-medium">
                  3 pts / quote
                </span>
                <span className="text-white/80 text-[11px] bg-white/10 px-2.5 py-1 rounded-lg font-medium">
                  2 pts / PDF
                </span>
              </div>
            </div>
            <button
              onClick={() => toast.info("Points are completely free for now!", { description: "Keep using OtoQuote AI — no payment needed." })}
              className="flex items-center gap-1.5 bg-white text-[#0056D2] px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-white/90 transition-colors whitespace-nowrap shrink-0"
            >
              <Zap size={14} />
              Buy Points
            </button>
          </div>
        </div>

        {/* ── Profile details ── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div>
              <h2 className="font-semibold text-foreground text-sm">Personal Details</h2>
              <p className="text-muted-foreground text-xs mt-0.5">Your trade profile information</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-primary text-xs font-bold hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Pencil size={12} />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 text-muted-foreground text-xs font-semibold hover:bg-secondary px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X size={12} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Trade Type
                  </label>
                  <div className="relative">
                    <select
                      value={formData.trade_type}
                      onChange={(e) => setFormData({ ...formData, trade_type: e.target.value })}
                      className={selectClass}
                    >
                      <option value="">Select your trade</option>
                      {TRADE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      ▼
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    State of Operation
                  </label>
                  <div className="relative">
                    <select
                      value={formData.state_operation}
                      onChange={(e) =>
                        setFormData({ ...formData, state_operation: e.target.value })
                      }
                      className={selectClass}
                    >
                      <option value="">Select your state</option>
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      ▼
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <InfoRow label="Full Name" value={profile?.full_name} />
                <InfoRow label="Trade Type" value={profile?.trade_type} />
                <InfoRow label="State" value={profile?.state_operation} />
                <InfoRow label="Email" value={user?.email} />
              </>
            )}
          </div>
        </div>

        {/* ── Support ── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="font-semibold text-foreground text-sm">Support</h2>
          </div>
          <div className="divide-y divide-border/50">
            <SupportItem icon={<HelpCircle size={16} />} label="Help & Support" />
            <SupportItem icon={<Info size={16} />} label="About OtoQuote AI" />
          </div>
        </div>

        {/* ── Sign out ── */}
        <div className="pb-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-5 py-3.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        <div className="h-6 md:hidden" />
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold ${value ? "text-foreground" : "text-muted-foreground/50"}`}>
      {value || "Not set"}
    </span>
  </div>
);

const SupportItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/40 transition-colors text-left">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-sm font-medium text-foreground flex-1">{label}</span>
    <span className="text-muted-foreground text-xs">›</span>
  </button>
);

export default ProfilePage;
