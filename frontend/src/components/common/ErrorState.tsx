import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while processing your request. Please try again.',
  onRetry,
  fullPage = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 backdrop-blur-md">
      <div className="w-12 h-12 rounded-xl bg-rose-900/30 border border-rose-700/50 flex items-center justify-center text-rose-400">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-base font-semibold text-rose-200">{title}</h4>
        <p className="text-xs text-rose-300/80 mt-1">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="border-rose-700/50 text-rose-200 hover:bg-rose-900/30"
        >
          Try Again
        </Button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
};
