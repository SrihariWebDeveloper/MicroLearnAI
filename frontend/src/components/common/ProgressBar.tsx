import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'indigo' | 'emerald' | 'amber' | 'gradient';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'gradient',
  className = '',
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  const sizeHeight = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantColors = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    gradient: 'bg-linear-to-r from-indigo-500 via-violet-500 to-emerald-400',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium">
          {label && <span className="text-slate-300">{label}</span>}
          {showPercentage && <span className="text-indigo-400 font-mono font-semibold">{Math.round(normalizedProgress)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50 ${sizeHeight[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${variantColors[variant]}`}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
};
