import { useState } from 'react';
import { Lock, LogIn, ShieldCheck, Send, CheckCircle, AlertCircle, Loader2, User, Mail, MessageSquare, PlayCircle } from 'lucide-react';
import { GuideAnimation } from './GuideAnimation';
import { supabase } from '@/lib/supabase';

interface AccessControlProps {
  onLogin: () => void;
  onContact: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  note: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function AccessControl({ onLogin }: AccessControlProps) {
  const [form, setForm] = useState<FormData>({ firstName: '', lastName: '', email: '', note: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.note.trim()) {
      newErrors.note = 'Please tell us why you need access';
    } else if (form.note.trim().length < 10) {
      newErrors.note = 'Message must be at least 10 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    if (!validate()) return;

    setStatus('submitting');
    setErrorMsg('');

    try {
      const { error } = await supabase.from('access_requests').insert({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        note: form.note.trim(),
        status: 'new',
      });

      if (error) throw error;

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/access-request-email`;
        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            email: form.email.trim(),
            note: form.note.trim(),
          }),
        });
      } catch {
        // DB insert succeeded; email is best-effort
      }

      setStatus('success');
      setForm({ firstName: '', lastName: '', email: '', note: '' });
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again or contact the administrator directly.');
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top: access info */}
        <div className="relative glass-card p-8 sm:p-10 overflow-hidden mb-8 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col items-center">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 items-center justify-center text-white mb-6 shadow-lg shadow-primary-500/25">
              <ShieldCheck size={32} />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-4">
              <Lock size={14} />
              Access Controlled
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Need Access to NSAGPT?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mb-3">
              NSAGPT is an access-controlled platform. There is no public registration.
            </p>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mb-8">
              Send us your details and message. Our administrator will contact you with your account.
            </p>

            <button onClick={onLogin} className="btn-primary group">
              <LogIn size={18} />
              Login
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: request guide */}
          <RequestGuide />

          {/* Right: form */}
          <div className="glass-card p-8 sm:p-10">
            {status === 'success' ? (
              <div className="text-center py-8 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400 mx-auto mb-6">
                  <CheckCircle size={32} />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Request Sent Successfully
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                  Your access request has been submitted. The administrator will contact you soon.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="btn-secondary text-sm"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-1">
                    Request Access
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Fill in your details and we'll get back to you.
                  </p>
                </div>

                {status === 'error' && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/50 text-error-700 dark:text-error-400 animate-fade-in">
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{errorMsg}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    label="First Name"
                    icon={<User size={16} />}
                    value={form.firstName}
                    onChange={(v) => updateField('firstName', v)}
                    error={errors.firstName}
                    placeholder="John"
                    required
                  />
                  <FormField
                    label="Last Name"
                    icon={<User size={16} />}
                    value={form.lastName}
                    onChange={(v) => updateField('lastName', v)}
                    error={errors.lastName}
                    placeholder="Doe"
                    required
                  />
                </div>

                <FormField
                  label="Email"
                  icon={<Mail size={16} />}
                  value={form.email}
                  onChange={(v) => updateField('email', v)}
                  error={errors.email}
                  placeholder="you@example.com"
                  type="email"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Message / Note <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <textarea
                      value={form.note}
                      onChange={(e) => updateField('note', e.target.value)}
                      rows={4}
                      placeholder="Tell us why you need access to NSAGPT..."
                      className={`input-field !pl-12 resize-y ${
                        errors.note ? 'border-error-400 dark:border-error-600' : ''
                      }`}
                    />
                  </div>
                  {errors.note && <p className="text-xs text-error-500 mt-1">{errors.note}</p>}
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Request
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FormField({
  label,
  icon,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  required,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label} {required && <span className="text-error-500">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`input-field !pl-12 ${error ? 'border-error-400 dark:border-error-600' : ''}`}
        />
      </div>
      {error && <p className="text-xs text-error-500 mt-1">{error}</p>}
    </div>
  );
}

function RequestGuide() {
  const steps = [
    { title: 'Fill in your details', body: 'Enter your first name, last name and a working email address.' },
    { title: 'Tell us who you are', body: 'Write your school or academy name and why you need NSAGPT access.' },
    { title: 'Submit the request', body: 'Press "Submit Request" — you will see a confirmation right away.' },
    { title: 'Get your account', body: 'The administrator reviews the request and emails your login details.' },
  ];

  return (
    <div className="glass-card p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
          <PlayCircle size={20} />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">How to request access</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">A quick guided walkthrough</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-6">
        <GuideAnimation />
      </div>

      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{step.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
