import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { CheckCircle, Loader2, Mail, Phone, Send, User, X } from 'lucide-react';
import { submitSubscriptionRequestFn } from '@/lib/subscription.functions';
import { type SubscriptionPlanKey } from '@/lib/subscriptions';
import { useLivePlans } from '@/lib/useLivePlans';

export function SubscriptionRequestModal({
  planKey,
  onClose,
  onBack,
}: {
  planKey: SubscriptionPlanKey;
  onClose: () => void;
  onBack?: () => void;
}) {
  const plan = useLivePlans().find((item) => item.key === planKey);

  const submitRequest = useServerFn(submitSubscriptionRequestFn);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  if (!plan) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === 'submitting') return;
    const phone = form.phone.replace(/[\s()-]/g, '');
    if (form.fullName.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || !/^\+?\d{7,15}$/.test(phone)) {
      setError('Please enter a valid name, email and phone/WhatsApp number.');
      return;
    }
    setStatus('submitting');
    setError('');
    const normalizedEmail = form.email.trim().toLowerCase();
    const result = await submitRequest({
      data: {
        fullName: form.fullName.trim(),
        email: normalizedEmail,
        phone: form.phone.trim(),
        plan: planKey,
        message: form.message.trim(),
      },
    });
    if (!result.ok) {
      setStatus('error');
      setError(result.message);
      return;
    }
    setStatus('success');
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Subscription request"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X size={19} />
        </button>
        {status === 'success' ? (
          <div className="py-8 text-center">
            <CheckCircle size={48} className="mx-auto text-success-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">Request submitted</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Our team will contact you, verify your details and activate your {plan.name} subscription. Your login
              details will be emailed to you after approval.
            </p>
            <button onClick={onClose} className="btn-primary mt-6">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">SELECTED PLAN</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {plan.name} <span className="text-base font-normal text-slate-500">— {plan.duration}</span>
              </h3>
              <p className="text-sm text-slate-500">
                {plan.priceLabel} · {plan.userLimit} {plan.userLimit === 1 ? 'user' : 'users'}
              </p>
              {onBack && (
                <button type="button" onClick={onBack} className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-1">
                  Change plan
                </button>
              )}
            </div>
            <Field icon={<User size={16} />} label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
            <Field icon={<Mail size={16} />} label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field icon={<Phone size={16} />} label="Phone / WhatsApp" type="tel" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Message <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                className="input-field resize-y"
                rows={3}
                maxLength={1000}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Any details you want to share"
              />
            </div>
            {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}
            <button disabled={status === 'submitting'} className="btn-primary w-full disabled:opacity-60">
              {status === 'submitting' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {status === 'submitting' ? 'Submitting...' : 'Submit subscription request'}
            </button>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              No online payment is taken. Our team contacts you and activates the plan after verification.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  type = 'text',
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label} *</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input required className="input-field !pl-11" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
