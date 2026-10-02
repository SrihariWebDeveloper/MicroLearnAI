import React, { useEffect, useState } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Brain,
} from 'lucide-react';
import { assessmentApi } from '../../api/assessment';
import { AssessmentResult } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export const ResultsView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const subtopicId = searchParams.get('subtopic') || 'st-2';

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      setIsLoading(true);
      try {
        const res = await assessmentApi.getLatestResult(subtopicId);
        setResult(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to load assessment results.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [subtopicId]);

  if (isLoading) {
    return <LoadingState message="Loading saved assessment result..." />;
  }

  if (error || !result) {
    return <ErrorState message={error || 'No result is available for this assessment.'} />;
  }

  const passed = result.passed;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Banner Result Status */}
      <div
        className={`p-8 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden ${
          passed
            ? 'bg-linear-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-500/10'
            : 'bg-linear-to-r from-rose-950/60 via-slate-900 to-slate-900 border-rose-500/40 shadow-rose-500/10'
        }`}
      >
        <div className="space-y-2 text-center md:text-left">
          <Badge variant={passed ? 'emerald' : 'rose'} icon={passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}>
            {passed ? '85%+ THRESHOLD ACHIEVED' : 'SCORE BELOW 85% PASSTHROUGH'}
          </Badge>
          <h2 className="text-3xl font-bold text-slate-100">
            {passed ? 'Subtopic Mastered & Unlocked!' : 'Revision Required Before Unlock'}
          </h2>
          <p className="text-sm text-slate-300 max-w-lg">
            {passed
              ? 'Congratulations! You achieved 85%+ overall mastery. Next subtopic level is now unlocked.'
              : 'You scored under the 85% threshold. Review weak topics and retry assessment.'}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-40">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Overall Score</span>
          <span className={`text-4xl font-extrabold mt-1 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
            {result?.overall_score}%
          </span>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">Target: ≥ 85%</span>
        </div>
      </div>

      {/* Score Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Quiz Validation Score</CardTitle>
            <Badge variant="indigo" size="sm">{result?.quiz_score}%</Badge>
          </CardHeader>
          <CardContent>
            <ProgressBar progress={result?.quiz_score || 0} variant="indigo" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Coding Assessment Score (3 Problems)</CardTitle>
            <Badge variant="emerald" size="sm">{result?.coding_score}%</Badge>
          </CardHeader>
          <CardContent>
            <ProgressBar progress={result?.coding_score || 0} variant="emerald" />
          </CardContent>
        </Card>
      </div>

      {/* Weak Areas & Revision Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Brain className="w-5 h-5 text-indigo-400" />
            Performance & Weak Area Diagnostic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Identified Weak Areas
            </h4>
            <div className="flex flex-wrap gap-2">
              {result?.weak_areas.map((wa, idx) => (
                <Badge key={idx} variant="amber">
                  {wa}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              Recommended Next Step
            </h4>
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 space-y-1">
              {result?.recommendations.map((rec, idx) => (
                <p key={idx}>• {rec}</p>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {!passed ? (
              <NavLink to={`/assessment?subtopic=${subtopicId}`}>
                <Button variant="danger" size="md" leftIcon={<RotateCcw className="w-4 h-4" />}>
                  Retry Assessment (Target 85%+)
                </Button>
              </NavLink>
            ) : (
              <NavLink to="/roadmap">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Unlock & Proceed to Next Subtopic
                </Button>
              </NavLink>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
