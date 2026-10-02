import React, { useState } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const PracticeView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const subtopicId = searchParams.get('subtopic') || 'st-2';

  const questions = [
    {
      id: 'p1',
      question: 'Which python list comprehension syntax correctly filters numbers greater than 10?',
      options: [
        '[x for x in nums if x > 10]',
        '[if x > 10 for x in nums]',
        '[x filter x > 10 from nums]',
        'nums.filter(x => x > 10)',
      ],
      correctIndex: 0,
      explanation: 'The standard list comprehension syntax is [expression for item in iterable if condition].',
    },
    {
      id: 'p2',
      question: 'What happens if a while loop condition never evaluates to False and has no break statement?',
      options: [
        'Python raises a SyntaxError at compile time',
        'The loop runs infinitely until an OS timeout or memory limit occurs',
        'Python automatically terminates after 1000 iterations',
        'It converts to a for-loop implicitly',
      ],
      correctIndex: 1,
      explanation: 'Infinite loops keep executing until halted by an external interrupt or Docker sandbox timeout.',
    },
  ];

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qId: string, optionIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateScore = () => {
    let count = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) count++;
    });
    return Math.round((count / questions.length) * 100);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <Badge variant="indigo" icon={<Sparkles className="w-3.5 h-3.5" />}>
            Targeted Practice Lab
          </Badge>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">Conceptual Self-Check Questions</h2>
          <p className="text-xs text-slate-400">Validate your core understanding before launching the Docker coding sandbox.</p>
        </div>

        <NavLink to={`/lab?subtopic=${subtopicId}`}>
          <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Launch Coding Lab
          </Button>
        </NavLink>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const selected = selectedAnswers[q.id];
          const isCorrect = selected === q.correctIndex;

          return (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-200">
                  <span className="text-indigo-400 font-mono">Q{qIdx + 1}.</span> {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isOptSelected = selected === optIdx;
                    let optStyle = 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700';

                    if (submitted) {
                      if (optIdx === q.correctIndex) {
                        optStyle = 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200 font-semibold';
                      } else if (isOptSelected) {
                        optStyle = 'bg-rose-950/50 border-rose-500/60 text-rose-200';
                      }
                    } else if (isOptSelected) {
                      optStyle = 'bg-indigo-950/60 border-indigo-500/80 text-slate-100 font-semibold';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelect(q.id, optIdx)}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${optStyle}`}
                      >
                        <span>{opt}</span>
                        {submitted && optIdx === q.correctIndex && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                        {submitted && isOptSelected && optIdx !== q.correctIndex && (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${isCorrect ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-rose-950/30 border-rose-800/40 text-rose-300'}`}>
                    <strong>{isCorrect ? 'Correct!' : 'Incorrect:'}</strong> {q.explanation}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          {submitted && (
            <p className="text-sm font-semibold text-slate-100">
              Practice Score: <span className={calculateScore() >= 85 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{calculateScore()}%</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!submitted ? (
            <Button variant="primary" size="md" onClick={() => setSubmitted(true)}>
              Submit Practice Answers
            </Button>
          ) : (
            <NavLink to={`/lab?subtopic=${subtopicId}`}>
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Proceed to Coding Lab
              </Button>
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
};
