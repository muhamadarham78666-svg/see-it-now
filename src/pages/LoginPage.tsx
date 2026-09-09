import { useState } from 'react';
import { useNavigate, Link } from '@/lib/rr';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, Loader2, ShieldCheck, KeyRound, X } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { verifyAdminCodeFn } from '@/lib/admin.functions';
import { checkDeviceFn } from '@/lib/devices.functions';
import { deviceInfo } from '@/lib/deviceId';
import { ADMIN_TOKEN_KEY } from '@/lib/adminSession';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { AccessRequestForm } from '@/components/AccessRequestForm';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [code, setCode] = useState('');
  const verifyCode = useServerFn(verifyAdminCodeFn);
  const checkDevice = useServerFn(checkDeviceFn);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password, remember);

    if (error) {
      setError(error);
      setLoading(false);
      return;
    }

    if (mode !== 'admin') {
      // One approved device per account — a new device needs administrator approval.
      try {
        const info = deviceInfo();
        const check = await checkDevice({ data: info });
        if (check.status !== 'approved') {
          await supabase.auth.signOut();
          setError(
            check.status === 'rejected'
              ? 'This device has been blocked. Please contact the administrator.'
              : 'This device is not approved yet. Your request has been sent — please contact the administrator.',
          );
          setLoading(false);
          return;
        }
      } catch {
        await supabase.auth.signOut();
        setError('Device verification failed. Please contact the administrator.');
        setLoading(false);
        return;
      }
    }

    if (mode === 'admin') {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const { data: roles } = userId
        ? await supabase.from('user_roles').select('role').eq('user_id', userId)
        : { data: null };
      if (!roles?.some((r) => r.role === 'admin')) {
        await supabase.auth.signOut();
        setError('This account does not have administrator access.');
        setLoading(false);
        return;
      }
      setStep('code');
      setLoading(false);
      return;
    }

    navigate('/dashboard');
  };

  const handleCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await verifyCode({ data: { code } });
      if (!res.ok || !res.token) {
        setError('Incorrect verification code.');
        setCode('');
        setLoading(false);
        return;
      }
      sessionStorage.setItem(ADMIN_TOKEN_KEY, res.token);
      navigate('/admin');
    } catch {
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-900">
      {/* Left side — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900 items-center justify-center p-12">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-md text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3">
              <Logo size="lg" />
            </div>
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-4 leading-tight">
            Turn Your Study Material Into Smart Questions
          </h2>
          <p className="text-slate-300 leading-relaxed">
            AI-powered question generation and paper building for educators.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {['MCQ', 'Short', 'Long'].map((t) => (
              <div key={t} className="glass rounded-xl p-4">
                <div className="text-sm font-medium text-white">{t}</div>
                <div className="text-xs text-slate-400 mt-1">Questions</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-8">
              <ArrowLeft size={16} />
              Back to home
            </Link>

            <div className="lg:hidden mb-6">
              <Logo size="md" />
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-5">
              {mode === 'admin'
                ? 'Sign in with your administrator account to manage the platform.'
                : 'Sign in to your NSAGPT account to continue.'}
            </p>

            {step === 'credentials' && (
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {([
                { value: 'user' as const, label: 'User Login' },
                { value: 'admin' as const, label: 'Admin Login' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setMode(opt.value);
                    setError(null);
                  }}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === opt.value
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            )}
          </div>

          {step === 'code' ? (
          <form onSubmit={handleCode} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/50 text-error-700 dark:text-error-400 animate-fade-in">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Verification failed</p>
                  <p className="text-xs mt-0.5">{error}</p>
                </div>
              </div>
            )}
            <div className="p-5 rounded-2xl border border-primary-200 dark:border-primary-800/50 bg-primary-50/60 dark:bg-primary-900/10">
              <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 mb-1">
                <KeyRound size={16} />
                <span className="text-sm font-semibold">Two-step admin verification</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your private 4-digit access code to unlock the admin panel.
              </p>
              <input
                autoFocus
                inputMode="numeric"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="input-field mt-4 text-center tracking-[0.6em] text-xl font-semibold"
                autoComplete="one-time-code"
              />
            </div>
            <button type="submit" disabled={loading || code.length < 4} className="btn-primary w-full py-3 disabled:opacity-50">
              {loading ? (<><Loader2 size={18} className="animate-spin" /> Verifying...</>) : 'Verify & Open Admin Panel'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('credentials'); setCode(''); setError(null); }}
              className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-primary-600"
            >
              Use a different account
            </button>
          </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/50 text-error-700 dark:text-error-400 animate-fade-in">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Login failed</p>
                  <p className="text-xs mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field !pl-12"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field !pl-12 !pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/50"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : mode === 'admin' ? (
                'Sign In as Admin'
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          )}

          <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 mb-1">
              <ShieldCheck size={16} className="text-primary-500" />
              <span className="text-sm font-medium">Access-controlled platform</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              There is no public registration. Need an account?{' '}
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Contact the administrator
              </button>
            </p>
          </div>
        </div>
      </div>

      {contactOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          onClick={() => setContactOpen(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 sm:p-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setContactOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <AccessRequestForm onClose={() => setContactOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
