import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TRADE_TYPES = [
  'Electrician',
  'Plumber',
  'Builder / Mason',
  'Painter',
  'Carpenter',
  'Tiler',
  'Welder / Fabricator',
  'AC / Refrigeration Technician',
  'Generator Technician',
  'Borehole Driller',
  'Other',
];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors text-sm';

const selectClass =
  'w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors text-sm appearance-none cursor-pointer';

export default function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    trade_type: '',
    state: '',
  });

  useEffect(() => {
    if (session) navigate('/chat');
  }, [session, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        // Pass profile fields as user_metadata — stored instantly even without
        // an active session. The DB trigger reads these and populates profiles.
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              trade_type: formData.trade_type,
              state_operation: formData.state,
            },
          },
        });
        if (error) throw error;

        // If Supabase auto-confirmed the session (email confirm disabled),
        // also write the profile directly so it's available immediately.
        if (data.session && data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: formData.full_name,
            trade_type: formData.trade_type,
            state_operation: formData.state,
            points: 0,
          });
          navigate('/chat');
          return;
        }

        setSentTo(formData.email);
        setEmailSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        navigate('/chat');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp((v) => !v);
    setFormData({ email: '', password: '', full_name: '', trade_type: '', state: '' });
    setShowPassword(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background p-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-2xl border border-border/50 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Check your inbox</h2>
          <p className="text-muted-foreground text-sm mb-1">
            We sent a confirmation link to:
          </p>
          <p className="font-semibold text-foreground text-sm mb-5 break-all">{sentTo}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6">
            <p className="text-amber-800 text-sm font-semibold mb-1">Didn't see it?</p>
            <p className="text-amber-700 text-xs leading-relaxed">
              Check your <strong>spam or junk folder</strong> — sometimes confirmation emails land there.
              If you still can't find it, wait a minute and try signing up again.
            </p>
          </div>
          <button
            onClick={() => { setEmailSent(false); setIsSignUp(false); setFormData({ email: '', password: '', full_name: '', trade_type: '', state: '' }); }}
            className="w-full bg-[#0056D2] hover:bg-[#0056D2]/90 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background p-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-2xl border border-border/50">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/otoqoute logo.png"
            alt="OtoQuote AI Logo"
            className="h-16 w-auto mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-[#0056D2] mb-1">
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isSignUp
              ? 'Join thousands of Nigerian tradespeople'
              : 'Sign in to generate professional quotes'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sign-up only fields */}
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
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
                    name="trade_type"
                    value={formData.trade_type}
                    onChange={handleChange}
                    required
                    className={selectClass}
                  >
                    <option value="">Select your trade</option>
                    {TRADE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▼</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  State
                </label>
                <div className="relative">
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className={selectClass}
                  >
                    <option value="">Select your state</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▼</span>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className={inputClass}
            />
          </div>

          {/* Password with eye toggle */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Enter your password"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0056D2] hover:bg-[#0056D2]/90 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={toggleMode}
            className="text-[#0056D2] font-semibold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
