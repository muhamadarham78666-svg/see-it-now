import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { HeroVisual } from '@/components/landing/HeroVisual';
import { useLanguage } from '@/context/LanguageContext';

interface HeroProps {
  onGetStarted: () => void;
  onWatchGuide: () => void;
}

export function Hero({ onGetStarted, onWatchGuide }: HeroProps) {
  const { t, dir } = useLanguage();
  return (
    <section dir={dir} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-primary-950/20" />
      <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-60" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles size={16} className="text-primary-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t('land.hero.badge')}
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
              {t('land.hero.title1')}{' '}
              <span className="gradient-text">{t('land.hero.title2')}</span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              {t('land.hero.sub')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <button onClick={onGetStarted} className="btn-primary group">
                {t('land.getStarted')}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={onWatchGuide} className="btn-secondary group">
                <Play size={18} className="text-primary-500" />
                {t('land.watchGuide')}
              </button>
            </div>

            <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success-500" />
                {t('land.tag.time')}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-500" />
                {t('land.tag.langs')}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                {t('land.tag.ai')}
              </span>
            </div>
          </div>

          {/* Visual */}
          <div className="relative mx-auto max-w-md w-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
