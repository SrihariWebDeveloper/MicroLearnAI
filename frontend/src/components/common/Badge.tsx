import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  icon,
  className = '',
}) => {
  const variantStyles = {
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    indigo: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50',
    emerald: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50',
    amber: 'bg-amber-950/80 text-amber-300 border-amber-700/50',
    rose: 'bg-rose-950/80 text-rose-300 border-rose-700/50',
    violet: 'bg-violet-950/80 text-violet-300 border-violet-700/50',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
};
