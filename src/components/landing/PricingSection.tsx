import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Check, CheckCircle, Loader2, Mail, Phone, Send, User, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sendSubscriptionRequestMailFn } from '@/lib/subscription.functions';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanKey } from '@/lib/subscriptions';

export function PricingSection() {
  const [selected, setSelected] = useState<SubscriptionPlanKey | null>(null);
  return (
    <section id="pricing" className="py-20 sm:py-24 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">SUBSCRIPTIONS</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-2">Choose your NSAGPT plan</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-3">Select a plan and submit your contact details. Our team will contact you to activate it.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <article key={plan.key} className={`relative rounded-2xl border p-6 bg-white dark:bg-slate-900 ${plan.featured ? 'border-primary-500 shadow-xl shadow-primary-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
              {plan.featured && <span className="absolute -top-3 left-5 px-3 py-1 rounded-full bg-primary-600 text-white text-xs font-semibold">Most popular</span>}
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{plan.duration}</p>
              <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">{plan.priceLabel}</p>
              <div className="mt-5 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={17} className="text-success-500" /> Up to {plan.userLimit} {plan.userLimit === 1 ? 'user' : 'users'}</div>
              <button onClick={() => setSelected(plan.key)} className="btn-primary w-full mt-7">Select {plan.name}</button>
            </article>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5">No online payment is taken. The NSAGPT team will contact you after your request.</p>
      </div>
      {selected && <SubscriptionRequestModal planKey={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function SubscriptionRequestModal({ planKey, onClose }: { planKey: SubscriptionPlanKey; onClose: () => void }) {
  const plan = SUBSCRIPTION_PLANS.find((item) => item.key === planKey);
  const sendMail = useServerFn(sendSubscriptionRequestMailFn);
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
    const { data: existing } = await supabase.from('subscription_requests').select('id').eq('email', normalizedEmail).eq('plan_key', planKey).eq('status', 'new').maybeSingle();
    if (existing) {
      setStatus('error');
      setError('Your request is already pending. Our team will contact you soon.');
      return;
    }
    const { error: insertError } = await supabase.from('subscription_requests').insert({
      full_name: form.fullName.trim(), email: normalizedEmail, phone: form.phone.trim(), plan_key: planKey, message: form.message.trim(), status: 'new',
    });
    if (insertError) {
      setStatus('error');
      setError('Request could not be submitted. Please try again.');
      return;
    }
    try { await sendMail({ data: { ...form, email: normalizedEmail, plan: planKey } }); } catch { /* request is safely stored */ }
    setStatus('success');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Subscription request">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><X size={19} /></button>
        {status === 'success' ? (
          <div className="py-8 text-center"><CheckCircle size={48} className="mx-auto text-success-500" /><h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">Request submitted</h3><p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Our team will contact you and activate your {plan.name} subscription after confirmation.</p><button onClick={onClose} className="btn-primary mt-6">Done</button></div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div><p className="text-sm font-semibold text-primary-600 dark:text-primary-400">SELECTED PLAN</p><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{plan.name} <span className="text-base font-normal text-slate-500">— {plan.duration}</span></h3><p className="text-sm text-slate-500">{plan.priceLabel} · {plan.userLimit} {plan.userLimit === 1 ? 'user' : 'users'}</p></div>
            <Field icon={<User size={16} />} label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
            <Field icon={<Mail size={16} />} label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field icon={<Phone size={16} />} label="Phone / WhatsApp" type="tel" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message <span className="text-slate-400">(optional)</span></label><textarea className="input-field resize-y" rows={3} maxLength={1000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Any details you want to share" /></div>
            {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}
            <button disabled={status === 'submitting'} className="btn-primary w-full disabled:opacity-60">{status === 'submitting' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}{status === 'submitting' ? 'Submitting...' : 'Submit subscription request'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ icon, label, type = 'text', value, onChange }: { icon: React.ReactNode; label: string; type?: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label} *</label><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span><input required className="input-field !pl-11" type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div></div>;
}
