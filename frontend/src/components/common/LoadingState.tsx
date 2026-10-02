import React from 'react';
import { Loader2, BrainCircuit } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  subtext?: string;
  fullPage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading MicroLearn AI...',
  subtext = 'Orchestrating adaptive agents and content...',
  fullPage = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
        <div className="relative w-12 h-12 rounded-2xl bg-slate-900 border border-indigo-500/40 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <BrainCircuit className="w-6 h-6 text-indigo-400 animate-pulse" />
        </div>
        <Loader2 className="absolute w-16 h-16 text-indigo-500 animate-spin opacity-40" />
      </div>
      <div>
        <h4 className="text-base font-semibold text-slate-200">{message}</h4>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
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
