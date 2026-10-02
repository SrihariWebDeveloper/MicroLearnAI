import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox className="w-8 h-8 text-slate-500" />,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-10 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 border-dashed ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-slate-200">{title}</h4>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          leftIcon={<Plus className="w-4 h-4" />}
          className="mt-6"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
