import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';

const steps = [
  { num: '1', label: 'Understanding your chapter...', minPct: 20, maxPct: 95 },
  { num: '2', label: 'Identifying important topics...', minPct: 15, maxPct: 80 },
  { num: '3', label: 'Generating smart questions...', minPct: 10, maxPct: 65 },
];

export function HeroVisual() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 50);
    return () => clearInterval(interval);
  }, []);

  const getProgress = (stepIndex: number) => {
    const speed = 0.8 + stepIndex * 0.3;
    const offset = stepIndex * 1.2;
    const wave = Math.sin((tick * speed + offset * 10) * 0.04);
    const pct = steps[stepIndex].minPct + ((wave + 1) / 2) * (steps[stepIndex].maxPct - steps[stepIndex].minPct);
    return Math.max(5, Math.min(100, pct));
  };

  const getActiveStep = () => {
    const cycle = Math.floor(tick / 60) % 3;
    return cycle;
  };

  const activeStep = getActiveStep();

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-accent-500/20 rounded-3xl blur-2xl" />
      <div className="relative glass-card p-8 animate-float">
        <div className="flex items-center gap-3 mb-6">
          <Logo size="sm" />
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => {
            const pct = getProgress(i);
            const isActive = i === activeStep;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-700/30'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-md shadow-primary-500/30'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  {step.num}
                </div>
                <div className="flex-1">
                  <div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-100 ease-linear"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border border-primary-100 dark:border-primary-800/30">
          <div className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-2 tracking-wider">
            AI ANALYZING
          </div>
          <div className="space-y-1.5">
            <div className="text-sm text-slate-600 dark:text-slate-300">{steps[activeStep].label}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {['MCQ', 'Short', 'Long'].map((t, i) => (
            <div key={t} className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/30">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t}</div>
              <div className="text-lg font-bold gradient-text">{[8, 6, 6][i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-4 -right-4 glass-card px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 animate-float" style={{ animationDelay: '1s' }}>
        PDF • DOC • TXT
      </div>
      <div className="absolute -bottom-4 -left-4 glass-card px-4 py-2 text-sm font-medium text-accent-600 dark:text-accent-400 animate-float" style={{ animationDelay: '3s' }}>
        English • Urdu
      </div>
    </div>
  );
}
