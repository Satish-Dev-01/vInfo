import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'info';
}

export const Badge = ({ className, variant = 'default', children, ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-[#EAF3EE] text-[#1D5943] border border-[#1D5943]/20 dark:bg-[#1A382B] dark:text-[#52E098]',
    success: 'bg-[#EAF3EE] text-[#1D5943] border border-[#1D5943]/30 dark:bg-[#1A382B] dark:text-[#52E098]',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',
    info: 'bg-[#E8F0EC] text-[#1D5943] border border-[#1D5943]/20 dark:bg-[#1A382B] dark:text-[#52E098]',
    outline: 'border border-[#DDD6CA] text-[#4A5D54] dark:border-[#285743] dark:text-[#A3B8AD]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
