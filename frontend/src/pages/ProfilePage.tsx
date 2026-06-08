import { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  Loader2,
  Pencil,
  Check,
  X,
  HelpCircle,
  Info,
  Zap,
  User as UserIcon,
  Briefcase,
  MapPin,
  Mail,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Field, Input, Select, SectionCard } from "@/components/form-primitives";
import { Skeleton } from "@/components/ui/skeleton";

const TRADE_TYPES = [
  "Electrician", "Plumber", "Builder / Mason", "Painter", "Carpenter", "Tiler",
  "Welder / Fabricator", "AC / Refrigeration Technician", "Generator Technician",
  "Borehole Driller", "Other",
];

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: bootstrap, isLoading: loadingProfile } = useBootstrap();
  const updateProfile = useUpdateProfile();

  const profile = bootstrap?.profile ?? null;
  const isSaving = updateProfile.isPending;
  const profileId = profile?.id;
  const profileFullName = profile?.full_name;
  const profileTradeType = profile?.trade_type;
  const profileStateOperation = profile?.state_operation;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    trade_type: "",
    state_operation: "",
  });

  useEffect(() => {
    if (!profileId && !profileFullName && !profileTradeType && !profileStateOperation) return;
    setFormData({
      full_name: profileFullName || "",
      trade_type: profileTradeType || "",
      state_operation: profileStateOperation || "",
    });
  }, [profileId, profileFullName, profileTradeType, profileStateOperation]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: formData.full_name,
        trade_type: formData.trade_type,
        state_operation: formData.state_operation,
      });
      toast.success("Profile updated");
      setIsEditing(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        trade_type: profile.trade_type || "",
        state_operation: profile.state_operation || "",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
      toast.success("Signed out");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to sign out");
    }
  };

  const initials = useMemo(() => {
    return profile?.full_name
      ? profile.full_name
          .split(" ")
          .slice(0, 2)
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
      : user?.email?.[0]?.toUpperCase() ?? "U";
  }, [profile?.full_name, user?.email]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background">
      <div className="px-5 lg:px-8 pt-5 pb-3 bg-card/60 backdrop-blur-md shrink-0 border-b border-border/50 sticky top-0 z-10">
        <h1 className="text-[20px] lg:text-[22px] font-bold text-foreground tracking-tight">
          Profile & Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your account details</p>
      </div>

      <div className="mobile-scroll flex-1 px-4 lg:px-8 py-5">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* ── Identity card ───────────────────────────────────────────── */}
          {loadingProfile && !profile ? (
            <IdentityCardSkeleton />
          ) : (
            <div className="bg-card rounded-2xl border border-border/60 p-5 lg:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-4">
                <div className="w-[60px] h-[60px] lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-md">
                  <span className="text-primary-foreground font-bold text-lg lg:text-xl">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base lg:text-lg text-foreground truncate">
                    {profile?.full_name || "Your Name"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                  {profile?.trade_type && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      <Briefcase size={11} />
                      {profile.trade_type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Free-tier banner ────────────────────────────────────────── */}
          {/* Replaces the previous points-balance card. All features (chat */}
          {/* generation, quote save, PDF export, image upload) are free.   */}
          <div className="rounded-2xl p-5 lg:p-6 shadow-lg bg-gradient-to-br from-[#0056D2] to-[#003fa3] text-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Zap size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">
                  Everything's free
                </p>
                <p className="text-white text-lg lg:text-xl font-bold leading-snug">
                  Unlimited quotes, exports, and chat
                </p>
                <p className="text-white/80 text-xs lg:text-sm mt-1.5 leading-relaxed">
                  No points, no payment, no limits — generate as many quotes as you need.
                </p>
              </div>
            </div>
          </div>

          {/* ── Personal details ────────────────────────────────────────── */}
          <SectionCard
            title="Personal details"
            description="Your trade profile information"
            icon={<UserIcon size={16} />}
            action={
              !isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-primary text-xs font-bold hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors min-h-[44px]"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 text-muted-foreground text-xs font-semibold hover:bg-secondary px-3 py-2 rounded-lg transition-colors min-h-[44px]"
                  >
                    <X size={12} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 min-h-[44px]"
                  >
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Save
                  </button>
                </div>
              )
            }
          >
            {isEditing ? (
              <div className="space-y-4">
                <Field label="Full name">
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Trade type">
                    <Select
                      value={formData.trade_type}
                      onChange={(e) => setFormData({ ...formData, trade_type: e.target.value })}
                    >
                      <option value="">Select your trade</option>
                      {TRADE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="State of operation">
                    <Select
                      value={formData.state_operation}
                      onChange={(e) => setFormData({ ...formData, state_operation: e.target.value })}
                    >
                      <option value="">Select your state</option>
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                <InfoRow icon={<UserIcon size={14} />} label="Full name" value={profile?.full_name} />
                <InfoRow icon={<Briefcase size={14} />} label="Trade type" value={profile?.trade_type} />
                <InfoRow icon={<MapPin size={14} />} label="State" value={profile?.state_operation} />
                <InfoRow icon={<Mail size={14} />} label="Email" value={user?.email} muted />
              </div>
            )}
          </SectionCard>

          {/* ── Support ─────────────────────────────────────────────────── */}
          <SectionCard title="Support" icon={<HelpCircle size={16} />}>
            <div className="-mx-1 divide-y divide-border/50">
              <SupportItem icon={<HelpCircle size={15} />} label="Help & Support" />
              <SupportItem icon={<Info size={15} />} label="About OtoQuote AI" />
            </div>
          </SectionCard>

          {/* ── Sign out ────────────────────────────────────────────────── */}
          <div className="pb-6">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-5 py-3.5 rounded-xl font-semibold text-sm transition-colors min-h-[48px]"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>

          <div className="h-4 md:hidden" />
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────

const InfoRow = ({
  icon, label, value, muted,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  muted?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="text-muted-foreground/70 shrink-0">{icon}</span>
      <span className="text-[13px] text-muted-foreground">{label}</span>
    </div>
    <span
      className={`text-[13px] font-semibold truncate text-right ${
        value ? (muted ? "text-foreground/80" : "text-foreground") : "text-muted-foreground/50"
      }`}
    >
      {value || "Not set"}
    </span>
  </div>
);

const SupportItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className="w-full flex items-center gap-3 px-1 py-3.5 hover:bg-secondary/40 transition-colors text-left rounded-lg min-h-[44px]">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-sm font-medium text-foreground flex-1">{label}</span>
    <span className="text-muted-foreground/60 text-xs">›</span>
  </button>
);

const IdentityCardSkeleton = () => (
  <div className="bg-card rounded-2xl border border-border/60 p-5 lg:p-6">
    <div className="flex items-center gap-4">
      <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
);

export default ProfilePage;
