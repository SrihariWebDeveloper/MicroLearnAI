import React, { useState } from 'react';
import { Settings as SettingsIcon, Cpu, Shield, Key, Bell } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const SettingsView: React.FC = () => {
  const [model, setModel] = useState('openrouter/free');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <Badge variant="indigo" icon={<SettingsIcon className="w-3.5 h-3.5" />}>
            System Preferences
          </Badge>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">Application Settings</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Cpu className="w-5 h-5 text-indigo-400" />
            AI Provider Abstraction Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 font-mono">
            <p><span className="text-slate-500">Agent Framework:</span> <span className="text-indigo-300 font-bold">Google ADK Agent Orchestrator</span></p>
            <p><span className="text-slate-500">LLM Provider Gateway:</span> <span className="text-indigo-300 font-bold">OpenRouter API</span></p>
            <p><span className="text-slate-500">Configured Model:</span> <span className="text-emerald-400 font-bold">{model}</span></p>
            <p><span className="text-slate-500">API Key Security:</span> <span className="text-emerald-400">Backend Server Only (.env)</span></p>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">OpenRouter Model Override Alias:</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 font-mono focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Configurable via OPENROUTER_MODEL env on Flask server.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
