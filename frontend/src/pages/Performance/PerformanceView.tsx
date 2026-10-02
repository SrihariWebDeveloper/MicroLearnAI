import React, { useEffect, useState } from 'react';
import { TrendingUp, Brain, Flame, Clock, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { performanceApi } from '../../api/performance';
import { PerformanceRecord, MasteryPrediction } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export const PerformanceView: React.FC = () => {
  const [performance, setPerformance] = useState<PerformanceRecord | null>(null);
  const [mastery, setMastery] = useState<MasteryPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [perfRes, masteryRes] = await Promise.all([
        performanceApi.getPerformance(),
        performanceApi.getMasteryPrediction(),
      ]);
      setPerformance(perfRes);
      setMastery(masteryRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load performance data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  if (isLoading) {
    return <LoadingState message="Fetching Machine Learning mastery prediction data..." />;
  }

  if (error && !performance) {
    return <ErrorState message={error} onRetry={fetchPerformance} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Badge variant="emerald" icon={<TrendingUp className="w-3.5 h-3.5" />}>
            Machine Learning Analytics
          </Badge>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">Learner Mastery Diagnostic</h2>
          <p className="text-xs text-slate-400">Random Forest Classifier predicts topic mastery based on quiz scores, coding speed, and retry attempts.</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-right min-w-50">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Predicted Mastery</span>
          <span className="text-2xl font-bold text-emerald-400 capitalize">{mastery?.mastery_level || 'Unavailable'}</span>
          <span className="text-[10px] text-slate-500 block font-mono">Model: {mastery?.model_type}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Assessment Score</CardTitle>
            <Award className="w-5 h-5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-extrabold text-slate-100">{performance?.average_score ?? 'No scores yet'}{performance?.average_score !== null && performance?.average_score !== undefined ? '%' : ''}</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">Passing Threshold: ≥85%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Streak</CardTitle>
            <Flame className="w-5 h-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-extrabold text-amber-400">{performance?.streak_days} Days</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">Continuous learning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Study Time</CardTitle>
            <Clock className="w-5 h-5 text-violet-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-extrabold text-slate-100">{performance?.total_learning_hours} Hours</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">Recorded in interactive labs</p>
          </CardContent>
        </Card>
      </div>

      {/* Topics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-emerald-400">
              <CheckCircle2 className="w-5 h-5" /> Strong Mastered Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {performance?.strong_topics.map((t, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-200">
                <span>{t}</span>
                <Badge variant="emerald" size="sm">Mastered (≥85%)</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-amber-400">
              <AlertCircle className="w-5 h-5" /> Target Revision Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {performance?.weak_topics.map((t, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-200">
                <span>{t}</span>
                <Badge variant="amber" size="sm">Revision Recommended</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
