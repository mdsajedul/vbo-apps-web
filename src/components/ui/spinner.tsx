import { cn } from '@/lib/utils';
import React from 'react';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const variantClasses = {
  primary: 'border-b-2 border-blue-600',
  white: 'border-2 border-white/30 border-t-white',
};

export function Spinner({ className, size = 'md', variant = 'primary', ...props }: SpinnerProps) {
  return (
    <div 
      className={cn(
        'animate-spin rounded-full', 
        sizeClasses[size], 
        variantClasses[variant],
        className
      )} 
      {...props} 
    />
  );
}

export function PageLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center w-full h-full min-h-[50vh]", className)}>
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Spinner size="lg" className="mr-3" />
        Loading...
      </div>
    </div>
  );
}

