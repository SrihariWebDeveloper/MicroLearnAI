import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Map,
  Lock,
  CheckCircle2,
  PlayCircle,
  HelpCircle,
  Sparkles,
  Award,
  ChevronRight,
  Flame,
  AlertCircle,
} from 'lucide-react';
import { roadmapApi } from '../../api/roadmap';
import { Roadmap as RoadmapType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const RoadmapView: React.FC = () => {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<RoadmapType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmap = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await roadmapApi.getRoadmap();
      setRoadmap(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load your roadmap.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  if (isLoading) {
    return <LoadingState message="Rendering personalized game progression map..." />;
  }

  if (error && !roadmap) {
    return <ErrorState message={error} onRetry={fetchRoadmap} />;
  }

  if (!roadmap) {
    return (
      <EmptyState
        icon={<Map className="w-8 h-8 text-slate-500" />}
        title="Your roadmap is not ready"
        description="Complete learner onboarding to create a roadmap for your topic and current skill level."
        actionLabel="Start onboarding"
        onAction={() => navigate('/onboarding')}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Roadmap Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="indigo" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Level Progression Path
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Passing Threshold: 85%</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">{roadmap?.title}</h2>
          <p className="text-xs text-slate-400">{roadmap?.description}</p>
        </div>
        <div className="w-full md:w-64">
          <ProgressBar progress={roadmap?.progress_percentage || 0} label="Overall Completion" />
        </div>
      </div>

      {/* Levels Tree Grid */}
      <div className="space-y-10 relative">
        {roadmap?.levels.map((level, lvlIdx) => (
          <div key={level.id} className="relative space-y-4">
            {/* Level Connector Line */}
            {lvlIdx < (roadmap.levels.length - 1) && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-slate-800 -z-10" />
            )}

            {/* Level Header Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${
                    level.status === 'completed'
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                      : level.status === 'unlocked'
                      ? 'bg-linear-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {level.status === 'locked' ? <Lock className="w-4 h-4" /> : `L${level.level_number}`}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{level.title}</h3>
                  <p className="text-xs text-slate-400">{level.description}</p>
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

            {/* Subtopics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-0 md:pl-4">
              {level.subtopics.map((subtopic) => {
                const isCompleted = subtopic.status === 'completed';
                const isInProgress = subtopic.status === 'in_progress' || subtopic.status === 'available';
                const isLocked = subtopic.status === 'locked';

                return (
                  <Card
                    key={subtopic.id}
                    hoverEffect={!isLocked}
                    className={`relative flex flex-col justify-between ${
                      isCompleted
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : isInProgress
                        ? 'border-indigo-500/40 bg-indigo-950/20'
                        : 'opacity-60 bg-slate-950/40 border-slate-800/80 cursor-not-allowed'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-semibold text-slate-400">
                          {subtopic.estimated_minutes} mins • Micro-Lesson
                        </span>
                        {isCompleted && (
                          <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                            Passed ({subtopic.score}%)
                          </Badge>
                        )}
                        {isInProgress && (
                          <Badge variant="indigo" size="sm" icon={<PlayCircle className="w-3 h-3" />}>
                            Ready
                          </Badge>
                        )}
                        {isLocked && (
                          <Badge variant="slate" size="sm" icon={<Lock className="w-3 h-3" />}>
                            Locked
                          </Badge>
                        )}
                      </div>

                      <div>
                        <h4 className="text-base font-semibold text-slate-100">{subtopic.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{subtopic.description}</p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                      {isLocked ? (
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Requires level unlock
                        </span>
                      ) : (
                        <NavLink to={`/learn?subtopic=${subtopic.id}`} className="w-full">
                          <Button
                            variant={isCompleted ? 'outline' : 'primary'}
                            size="sm"
                            className="w-full"
                            rightIcon={<ChevronRight className="w-4 h-4" />}
                          >
                            {isCompleted ? 'Review Micro-Lesson' : 'Start Micro-Lesson'}
                          </Button>
                        </NavLink>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
