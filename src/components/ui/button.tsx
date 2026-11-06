import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    const variants = {
      default: 'bg-[#11281E] text-white hover:bg-[#1A382B] dark:bg-[#FAF7F2] dark:text-[#11281E] dark:hover:bg-white focus-visible:ring-[#1D5943]',
      primary: 'bg-[#1D5943] text-white hover:bg-[#164836] shadow-sm shadow-[#1D5943]/25 focus-visible:ring-[#1D5943]',
      secondary: 'bg-[#EAF3EE] text-[#1D5943] hover:bg-[#D8E8DF] dark:bg-[#1A392C] dark:text-[#52E098] dark:hover:bg-[#234D3C]',
      outline: 'border border-[#DDD6CA] bg-white hover:bg-[#F3EFE7] dark:border-[#285743] dark:bg-[#142D21] dark:hover:bg-[#1B3B2C] text-[#14281F] dark:text-[#FAF7F2]',
      ghost: 'hover:bg-[#EBE5DA] dark:hover:bg-[#1B3C2D] text-[#34483E] dark:text-[#C5D8CE]',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600',
      link: 'text-[#1D5943] underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
