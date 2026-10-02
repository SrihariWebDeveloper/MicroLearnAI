import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { recommendationsApi } from '../../api/recommendations';
import { Recommendation } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const RecommendationsView: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await recommendationsApi.getRecommendations();
      setRecommendations(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (isLoading) {
    return <LoadingState message="Recommendation Agent evaluating hybrid ML + Rule models..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchRecommendations} />;
  }

  const dismiss = async (id: string) => {
    try {
      await recommendationsApi.dismissRecommendation(id);
      setRecommendations((current) => current.filter((item) => item.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to dismiss recommendation.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Badge variant="indigo" icon={<Sparkles className="w-3.5 h-3.5" />}>
            Adaptive Hybrid Recommendation System
          </Badge>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">Next Learning Steps</h2>
          <p className="text-xs text-slate-400">Recommendations are based on saved assessment results and roadmap progression.</p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState
          title="No Recommendations Pending"
          description="There is no pending rule-based action. Continue with an unlocked roadmap topic."
          actionLabel="Go to Roadmap"
          onAction={() => (window.location.href = '/roadmap')}
        />
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} glow={rec.urgency === 'high' ? 'amber' : 'indigo'}>
              <CardContent className="space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={rec.urgency === 'high' ? 'rose' : rec.urgency === 'medium' ? 'amber' : 'indigo'}>
                      {rec.type.toUpperCase()} • {rec.urgency} priority
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Generated: {new Date(rec.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-100">{rec.title}</h3>
                  <p className="text-xs text-slate-300 mt-1">{rec.description}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-indigo-300 font-mono space-y-1">
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Reasoning:</span>
                  <p className="italic">"{rec.reasoning}"</p>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => dismiss(rec.id)} leftIcon={<X className="w-4 h-4" />}>
                      Dismiss
                    </Button>
                    <NavLink to={rec.target_subtopic_id ? `/learn?subtopic=${rec.target_subtopic_id}` : '/roadmap'}>
                      <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                        Open next step
                      </Button>
                    </NavLink>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
