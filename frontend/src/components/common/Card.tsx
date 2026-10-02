import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glow?: 'indigo' | 'emerald' | 'amber' | 'none';
  variant?: 'glass' | 'solid' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  glow = 'none',
  variant = 'glass',
  ...props
}) => {
  const variantStyles = {
    glass: 'bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 shadow-xl shadow-slate-950/50',
    solid: 'bg-slate-900 border border-slate-800 shadow-md',
    bordered: 'bg-transparent border border-slate-800',
  };

  const glowStyles = {
    indigo: 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
    emerald: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
    amber: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
    none: '',
  };

  const hoverClass = hoverEffect ? `transition-all duration-300 hover:-translate-y-0.5 ${glowStyles[glow]}` : '';

  return (
    <div
      className={`rounded-2xl p-6 ${variantStyles[variant]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`flex items-center justify-between pb-4 border-b border-slate-800/60 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-slate-100 flex items-center gap-2 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-slate-400 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`space-y-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`pt-4 border-t border-slate-800/60 mt-4 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);
