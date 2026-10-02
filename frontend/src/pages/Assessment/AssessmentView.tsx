import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckSquare, Code2, AlertTriangle, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { assessmentApi } from '../../api/assessment';
import { Assessment, CodingProblem, QuizQuestion } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export const AssessmentView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subtopicId = searchParams.get('subtopic') || 'st-2';

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [codingAnswers, setCodingAnswers] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await assessmentApi.getAssessment(subtopicId);
      setAssessment(data);
      setCodingAnswers(Object.fromEntries(
        data.coding_questions.map((question) => [question.id, question.initial_code])
      ));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load this assessment.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, [subtopicId]);

  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await assessmentApi.submitAssessment({
        subtopic_id: subtopicId,
        quiz_answers: quizAnswers,
        coding_answers: codingAnswers,
      });
      navigate(`/results?subtopic=${subtopicId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Assessment submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading assessment questions..." />;
  }

  if (error && !assessment) {
    return <ErrorState message={error} onRetry={fetchAssessment} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {error && <div role="alert" className="p-3 rounded-lg bg-rose-950/40 text-sm text-rose-300">{error}</div>}
      {/* Assessment Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="rose" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
              Official Subtopic Assessment
            </Badge>
            <span className="text-xs font-mono text-amber-400 font-bold">Requirement: Score ≥ 85% to Unlock Next Subtopic</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">{assessment?.title}</h2>
          <p className="text-xs text-slate-400">Complete Part A (Quiz) + Part B (Exactly 3 Coding Questions).</p>
        </div>

        <Button
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          onClick={handleSubmitAssessment}
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Submit Final Assessment
        </Button>
      </div>

      {/* PART A: QUIZ QUESTIONS */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
          <CheckSquare className="w-5 h-5 text-indigo-400" />
          Part A: Concept Validation Quiz
        </h3>

        {assessment?.quiz_questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-sm">
                <span className="text-indigo-400 font-mono">Q{idx + 1}.</span> {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {q.options.map((opt, optIdx) => {
                const selected = quizAnswers[q.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selected
                        ? 'bg-indigo-950/70 border-indigo-500 text-slate-100 font-semibold shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PART B: 3 CODING QUESTIONS */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Code2 className="w-5 h-5 text-emerald-400" />
          Part B: Practical Assessment (Exactly 3 Coding Questions)
        </h3>

        {assessment?.coding_questions.map((cq, idx) => (
          <Card key={cq.id}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between w-full">
                <span>
                  <span className="text-emerald-400 font-mono">Coding Q{idx + 1}.</span> {cq.title}
                </span>
                <Badge variant="emerald" size="sm">Docker Evaluated</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-300">{cq.description}</p>
              <textarea
                value={codingAnswers[cq.id] || ''}
                onChange={(e) => setCodingAnswers((prev) => ({ ...prev, [cq.id]: e.target.value }))}
                rows={5}
                spellCheck={false}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 focus:outline-none focus:border-indigo-500"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
