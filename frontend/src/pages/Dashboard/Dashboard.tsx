import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Flame,
  Clock,
  CheckCircle2,
  Brain,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Code2,
} from 'lucide-react';
import { performanceApi } from '../../api/performance';
import { recommendationsApi } from '../../api/recommendations';
import { roadmapApi } from '../../api/roadmap';
import { PerformanceRecord, MasteryPrediction, Recommendation, Roadmap } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const Dashboard: React.FC = () => {
  const [performance, setPerformance] = useState<PerformanceRecord | null>(null);
  const [mastery, setMastery] = useState<MasteryPrediction | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [perfRes, masteryRes, recsRes, roadmapRes] = await Promise.allSettled([
        performanceApi.getPerformance(),
        performanceApi.getMasteryPrediction(),
        recommendationsApi.getRecommendations(),
        roadmapApi.getRoadmap(),
      ]);

      if (perfRes.status === 'fulfilled') setPerformance(perfRes.value);
      if (masteryRes.status === 'fulfilled') setMastery(masteryRes.value);
      if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value);
      if (roadmapRes.status === 'fulfilled') setRoadmap(roadmapRes.value);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard data.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Fetching live dashboard data..." subtext="Syncing your ML mastery score and active roadmap..." />;
  }

  if (error && !roadmap && !performance) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  // Active subtopic calculation
  const currentSubtopic = roadmap?.levels
    .flatMap((lvl) => lvl.subtopics)
    .find((st) => st.status === 'in_progress' || st.status === 'available');

  const topRecommendation = recommendations[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-900/40 via-violet-900/30 to-slate-900 p-6 md:p-8 border border-indigo-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <Badge variant="violet" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Personalized Learning
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              Ready for your next micro-lesson?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your active path <strong className="text-indigo-300">{roadmap?.target_domain || 'not set up yet'}</strong> is{' '}
              <span className="font-semibold text-emerald-400">{roadmap?.progress_percentage || 0}% complete</span>. Achieve 85%+ in assessments to unlock progressive levels.
            </p>
          </div>
          {currentSubtopic ? (
            <NavLink to={`/learn?subtopic=${currentSubtopic.id}`}>
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Continue: {currentSubtopic.title}
              </Button>
            </NavLink>
          ) : (
            <NavLink to="/onboarding">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Setup Personalized Roadmap
              </Button>
            </NavLink>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Learning Streak</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1 flex items-baseline gap-1">
                {performance?.streak_days ?? 0} <span className="text-xs text-amber-400 font-normal">days</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6 fill-amber-400/20" />
            </div>
          </div>
        </Card>

        {/* ML Mastery Prediction */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Random Forest Mastery</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1 capitalize">
                {mastery?.mastery_level || 'Unavailable'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {mastery?.mastery_score === null || mastery?.mastery_score === undefined
                  ? mastery?.reason || 'No validated prediction available'
                  : `Probability: ${Math.round(mastery.mastery_score * 100)}%`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Brain className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Learning Hours */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Learning Time</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1 flex items-baseline gap-1">
                {performance?.total_learning_hours ?? 0} <span className="text-xs text-slate-400 font-normal">hrs</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Subtopics Completed */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Subtopics Cleared</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {performance?.completed_subtopics_count ?? 0} / {performance?.total_subtopics_count ?? 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Roadmap Progress & AI Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roadmap Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Active Learning Progression
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">
                  Game-inspired levels unlocked upon achieving 85%+ score in 3-question assessments.
                </p>
              </div>
              <NavLink to="/roadmap">
                <Button variant="outline" size="sm">
                  View Full Roadmap
                </Button>
              </NavLink>
            </CardHeader>

            <CardContent>
              {roadmap ? (
                <div className="space-y-5">
                  <ProgressBar progress={roadmap.progress_percentage} label="Overall Mastery Progress" />

                  <div className="space-y-3 pt-2">
                    {roadmap.levels.slice(0, 3).map((level) => (
                      <div
                        key={level.id}
                        className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              level.status === 'completed'
                                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                                : level.status === 'unlocked'
                                ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-400'
                                : 'bg-slate-800 border border-slate-700 text-slate-500'
                            }`}
                          >
                            L{level.level_number}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-200">{level.title}</h4>
                            <p className="text-xs text-slate-400">{level.subtopics.length} Micro-subtopics</p>
                          </div>
                        </div>

                        <Badge
                          variant={
                            level.status === 'completed'
                              ? 'emerald'
                              : level.status === 'unlocked'
                              ? 'indigo'
                              : 'slate'
                          }
                        >
                          {level.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No Active Roadmap Found"
                  description="Complete onboarding to create a starter path for your topic and current skill level."
                  actionLabel="Start Onboarding"
                  onAction={() => (window.location.href = '/onboarding')}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendation Sidebar Card */}
        <div className="space-y-6">
          <Card glow="indigo" className="relative">
            <CardHeader>
              <CardTitle>
                <Sparkles className="w-5 h-5 text-violet-400" />
                Adaptive Recommendation
              </CardTitle>
              <Badge variant="indigo" size="sm">
                Rules
              </Badge>
            </CardHeader>

            <CardContent>
              {topRecommendation ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-linear-to-br from-indigo-950/40 to-slate-900 border border-indigo-800/40 space-y-2">
                    <Badge variant={topRecommendation.urgency === 'high' ? 'rose' : 'amber'} size="sm">
                      {topRecommendation.type} • {topRecommendation.urgency} priority
                    </Badge>
                    <h4 className="text-sm font-semibold text-slate-100">{topRecommendation.title}</h4>
                    <p className="text-xs text-slate-300">{topRecommendation.description}</p>
                    <p className="text-[11px] text-indigo-300/80 italic font-mono pt-1 border-t border-indigo-900/40">
                      "{topRecommendation.reasoning}"
                    </p>
                  </div>
                  <NavLink to="/recommendations">
                    <Button variant="primary" size="sm" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Execute Recommended Activity
                    </Button>
                  </NavLink>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <p className="text-xs text-slate-300">
                    No recommendation is available yet. Complete onboarding or an assessment to create a next step.
                  </p>
                  <NavLink to="/practice">
                    <Button variant="outline" size="sm" className="w-full" leftIcon={<Code2 className="w-4 h-4" />}>
                      Launch Practice Lab
                    </Button>
                  </NavLink>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Topics Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Mastery Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-2 font-mono">
                  Strong Topics (≥85%)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(performance?.strong_topics || []).map((topic) => (
                    <Badge key={topic} variant="emerald" size="sm">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-2 font-mono">
                  Targeted Revision Areas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(performance?.weak_topics || []).map((topic) => (
                    <Badge key={topic} variant="amber" size="sm">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
