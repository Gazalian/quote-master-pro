import { User, Zap, ChevronRight } from "lucide-react";

const ProfilePage = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 bg-card shrink-0">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Avatar & name */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={36} className="text-primary" />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-foreground">Emeka Okonkwo</p>
            <p className="text-sm text-muted-foreground">Electrician · Lagos, Nigeria</p>
          </div>
        </div>

        {/* Points balance */}
        <div className="bg-primary rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-xs font-medium">Points Balance</p>
            <p className="text-primary-foreground text-3xl font-bold">47</p>
            <p className="text-primary-foreground/70 text-xs mt-0.5">3 pts per quote · 2 pts per PDF</p>
          </div>
          <div className="flex flex-col gap-2">
            <button className="bg-primary-foreground/20 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold">
              Buy Points
            </button>
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-1">
          <MenuItem label="Account Information" />
          <MenuItem label="Trade Type" value="Electrician" />
          <MenuItem label="Purchase History" />
          <MenuItem label="Notification Settings" />
          <MenuItem label="Help & Support" />
          <MenuItem label="About OtoQuote" />
        </div>

        <button className="w-full bg-destructive/10 text-destructive py-3 rounded-xl font-semibold text-sm">
          Sign Out
        </button>
        <div className="h-4" />
      </div>
    </div>
  );
};

const MenuItem = ({ label, value }: { label: string; value?: string }) => (
  <button className="w-full flex items-center justify-between bg-card rounded-xl px-4 py-3.5 border border-border">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <div className="flex items-center gap-1.5">
      {value && <span className="text-xs text-muted-foreground">{value}</span>}
      <ChevronRight size={16} className="text-muted-foreground" />
    </div>
  </button>
);

export default ProfilePage;
