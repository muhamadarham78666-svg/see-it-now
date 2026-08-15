import { Brain } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 28, text: 'text-2xl' },
    lg: { icon: 36, text: 'text-3xl' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl blur-md opacity-50" />
        <div className="relative bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center text-white p-1.5">
          <Brain size={s.icon} strokeWidth={2.5} />
        </div>
      </div>
      <span className={`font-display font-bold tracking-tight ${s.text}`}>
        <span className="text-slate-900 dark:text-white">NSA</span>
        <span className="gradient-text">GPT</span>
      </span>
    </div>
  );
}
