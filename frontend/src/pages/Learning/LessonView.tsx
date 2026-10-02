import React, { useEffect, useState } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import {
  BookOpen,
  Code2,
  Video,
  FileText,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { learningApi } from '../../api/learning';
import { Lesson } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export const LessonView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const subtopicId = searchParams.get('subtopic') || 'st-2';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'explanation' | 'examples' | 'script' | 'summary'>('explanation');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLesson = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await learningApi.getLesson(subtopicId);
      setLesson(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load this lesson.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [subtopicId]);

  const generateLesson = async () => {
    setError(null);
    setIsGenerating(true);
    try {
      setLesson(await learningApi.generateLesson(subtopicId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI lesson generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const completeLesson = async () => {
    setError(null);
    setIsCompleting(true);
    try {
      const completion = await learningApi.completeLesson(subtopicId);
      setCompletedAt(new Date().toISOString());
      if (!completion.success) setError('The lesson completion was not recorded.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to record lesson completion.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading lesson content..." />;
  }

  if (error && !lesson) {
    return <ErrorState message={error} onRetry={fetchLesson} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="indigo" icon={<Sparkles className="w-3.5 h-3.5" />}>
              {lesson?.content_source === 'google_adk_openrouter' ? 'AI Generated Micro-Lesson' : 'Curated Development Lesson'}
            </Badge>
            <span className="text-xs font-mono text-slate-400">ID: {subtopicId}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">{lesson?.title}</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">{lesson?.overview}</p>
        </div>

        <div className="flex items-center gap-3">
          {lesson?.content_source !== 'google_adk_openrouter' && (
            <Button variant="outline" size="sm" onClick={generateLesson} isLoading={isGenerating}>
              Generate AI Lesson
            </Button>
          )}
          <NavLink to={`/practice?subtopic=${subtopicId}`}>
            <Button variant="outline" size="sm">
              Practice Questions
            </Button>
          </NavLink>
          <NavLink to={`/lab?subtopic=${subtopicId}`}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Launch Coding Lab
            </Button>
          </NavLink>
        </div>
      </div>

      {error && <div role="alert" className="p-3 rounded-lg bg-rose-950/40 text-sm text-rose-300">{error}</div>}

      {/* Main Content Tabs */}
      <Card>
        <CardHeader className="border-b border-slate-800">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'explanation', label: 'Explanation', icon: BookOpen },
              { id: 'examples', label: 'Code Examples', icon: Code2 },
              { id: 'script', label: 'Video Script', icon: Video },
              { id: 'summary', label: 'Summary', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Tab 1: Explanation */}
          {activeTab === 'explanation' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-300 font-mono uppercase tracking-wider mb-3">
                  Key Learning Objectives
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lesson?.key_concepts.map((concept, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{concept}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line font-sans">
                {lesson?.detailed_content}
              </div>
            </div>
          )}

          {/* Tab 2: Code Examples */}
          {activeTab === 'examples' && (
            <div className="space-y-6">
              {lesson?.code_examples.map((example, idx) => (
                <div key={idx} className="space-y-3 p-5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-indigo-300 font-mono">{example.title}</h4>
                    <Badge variant="indigo" size="sm">{example.language}</Badge>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                    <code>{example.code}</code>
                  </pre>
                  <p className="text-xs text-slate-400">{example.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Video Script */}
          {activeTab === 'script' && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                Video Explanation Script
              </h4>
              <div className="p-4 rounded-xl bg-slate-900 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-line border border-slate-800">
                {lesson?.video_script}
              </div>
            </div>
          )}

          {/* Tab 4: Summary */}
          {activeTab === 'summary' && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold text-slate-200">Micro-Lesson Summary</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{lesson?.summary}</p>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-end gap-4">
            {completedAt ? (
              <span className="text-xs text-emerald-300">Lesson activity recorded</span>
            ) : (
              <Button variant="outline" size="md" onClick={completeLesson} isLoading={isCompleting}>
                Mark lesson complete
              </Button>
            )}
            <NavLink to={`/lab?subtopic=${subtopicId}`}>
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Proceed to Interactive Lab
              </Button>
            </NavLink>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
