import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm transition-all duration-200',
        hover && 'hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-700/50 hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
