import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'accent';
  className?: string;
}

const variants = {
  default: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300',
  primary: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  accent: 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300',
  success: 'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-300',
  warning: 'bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300',
  error: 'bg-error-100 dark:bg-error-900/40 text-error-700 dark:text-error-300',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
}
