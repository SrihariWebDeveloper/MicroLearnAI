import React, { useEffect, useState } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import {
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { learningApi } from '../../api/learning';
import { CodingProblem, CodeSubmission } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export const LabView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const subtopicId = searchParams.get('subtopic') || 'st-2';

  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  const [submission, setSubmission] = useState<CodeSubmission | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProblem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await learningApi.getCodingProblem(subtopicId);
      setProblem(data);
      setCode(data.initial_code || '# Write your python logic here\n');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load this coding problem.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblem();
  }, [subtopicId]);

  const handleRunSubmit = async () => {
    if (!problem) return;
    setIsExecuting(true);
    setSubmission(null);
    setError(null);
    try {
      const res = await learningApi.submitCode(problem.id, code, language);
      setSubmission(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Code execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading coding problem..." />;
  }

  if (error && !problem) {
    return <ErrorState message={error} onRetry={fetchProblem} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="indigo" icon={<Code2 className="w-3.5 h-3.5" />}>
              Interactive Coding Lab
            </Badge>
            <Badge variant={problem?.difficulty === 'easy' ? 'emerald' : 'amber'} size="sm">
              {problem?.difficulty}
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{problem?.title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCode(problem?.initial_code || '')}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Code
          </Button>
          <NavLink to={`/assessment?subtopic=${subtopicId}`}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Launch Subtopic Assessment
            </Button>
          </NavLink>
        </div>
      </div>

      {/* Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Problem Specs */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Problem Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                {problem?.description}
              </p>

              <div>
                <h4 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Sample Test Cases
                </h4>
                <div className="space-y-2">
                  {problem?.test_cases.map((tc, idx) => (
                    <div key={tc.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                      <p className="text-slate-400">Input: <span className="text-indigo-300">{tc.input}</span></p>
                      <p className="text-slate-400">Expected Output: <span className="text-emerald-400">{tc.expected_output}</span></p>
                    </div>
                  ))}
                </div>
              </div>

              {problem?.solution_hint && (
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                  <span><strong>Hint:</strong> {problem.solution_hint}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Editor & Execution Results */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="flex flex-col p-0 overflow-hidden">
            <div className="h-11 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-800 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>main.py</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-900 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-800 focus:outline-none"
              >
                <option value="python">Python 3.11</option>
              </select>
            </div>

            {/* Monospaced Code Textarea */}
            <div className="relative bg-slate-950">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={14}
                spellCheck={false}
                className="w-full p-4 bg-transparent font-mono text-xs text-slate-200 focus:outline-none resize-none leading-relaxed select-text"
              />
            </div>

            {/* Run Button Bar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Environment: Docker Isolated Sandbox
              </span>
              <Button
                variant="primary"
                size="sm"
                isLoading={isExecuting}
                onClick={handleRunSubmit}
                leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
              >
                Run & Test Code
              </Button>
            </div>
          </Card>

          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}

          {/* Test Results Output */}
          {submission && (
            <Card className="animate-in fade-in duration-200">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-sm">
                    Execution Result:{' '}
                    <span className={submission.status === 'passed' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {submission.status.toUpperCase()}
                    </span>
                  </CardTitle>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {submission.execution_time_ms} ms
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {submission.test_results.map((tr, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                      tr.passed ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {tr.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      <span>Test Case {idx + 1}</span>
                    </div>
                    <span>Output: {tr.actual_output}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
