import type { ReactNode } from 'react';
import { useNavigate } from '@/lib/rr';
import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';

interface Props {
  title: string;
  intro?: string;
  children: ReactNode;
}

/** Shared shell for the public information pages (About, FAQ, Terms, Privacy, Contact). */
export function ContentPage({ title, intro, children }: Props) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <LandingNav onGetStarted={() => navigate('/login')} />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          {title}
        </h1>
        {intro && (
          <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">{intro}</p>
        )}
        <div className="mt-10 space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{heading}</h2>
      {children}
    </section>
  );
}
