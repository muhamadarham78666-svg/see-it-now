import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full border-slate-200 dark:border-slate-700 border-t-primary-500 animate-spin',
        sizeMap[size],
        className,
      )}
    />
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Spinner size="lg" />
      {message && <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-700/40 text-slate-400 dark:text-slate-500">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
