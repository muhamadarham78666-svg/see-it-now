import { Lock, LogIn, ShieldCheck, PlayCircle } from 'lucide-react';
import { AccessRequestAnimation } from './AccessRequestAnimation';
import { AccessRequestForm } from '@/components/AccessRequestForm';

interface AccessControlProps {
  onLogin: () => void;
  onContact: () => void;
}

export function AccessControl({ onLogin }: AccessControlProps) {
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
            <AccessRequestForm />
          </div>
        </div>
      </div>
    </section>
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

      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-6 h-[380px] sm:h-[400px]">
        <AccessRequestAnimation />
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
