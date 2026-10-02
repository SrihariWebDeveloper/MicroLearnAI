import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  BrainCircuit,
  Target,
  Clock,
  Calendar,
  Layers,
} from 'lucide-react';
import { authApi } from '../../api/auth';
import { roadmapApi } from '../../api/roadmap';
import { SkillLevel } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [targetDomain, setTargetDomain] = useState('Python Full Stack');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [learningGoal, setLearningGoal] = useState('Build AI Microservices & Web Apps');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [preferredSchedule, setPreferredSchedule] = useState('Evenings (7-9 PM)');
  const [preferences, setPreferences] = useState<string[]>(['Interactive Labs', 'Code Snippets']);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePreference = (item: string) => {
    setPreferences((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item]
    );
  };

  const handleCompleteOnboarding = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const profileData = {
        learning_goal: learningGoal,
        target_domain: targetDomain,
        skill_level: skillLevel,
        hours_per_day: hoursPerDay,
        preferred_schedule: preferredSchedule,
        preferences,
      };

      await authApi.saveLearnerProfile(profileData);
      await roadmapApi.generateRoadmap(profileData);

      navigate('/roadmap');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate personalized roadmap.';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Wizard Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
          Learner Onboarding & <span className="gradient-text">Roadmap Wizard</span>
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Share your learning goals and preferences to create a deterministic starter roadmap.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <ProgressBar
          progress={(step / totalSteps) * 100}
          label={`Step ${step} of ${totalSteps}`}
          variant="gradient"
        />
      </div>

      {/* Wizard Card */}
      <Card glow="indigo" className="relative overflow-hidden">
        {error && (
          <div className="p-3.5 mb-6 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300">
            {error}
          </div>
        )}

        <CardContent>
          {/* STEP 1: What do you want to learn? */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">1. What topic or domain do you want to master?</h3>
                  <p className="text-xs text-slate-400">Specify your main subject of interest.</p>
                </div>
              </div>

              <div className="space-y-3">
                {['Python & AI Systems', 'Full Stack Web Development', 'Data Structures & Algorithms', 'Machine Learning Foundations'].map(
                  (domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setTargetDomain(domain)}
                      className={`w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                        targetDomain === domain
                          ? 'bg-indigo-950/60 border-indigo-500/80 text-slate-100 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-medium text-sm">{domain}</span>
                      {targetDomain === domain && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                    </button>
                  )
                )}

                <div className="pt-2">
                  <label className="block text-xs font-mono text-slate-400 mb-1">Or enter a custom domain:</label>
                  <input
                    type="text"
                    value={targetDomain}
                    onChange={(e) => setTargetDomain(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. React & TypeScript"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Skill Level */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Layers className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">2. What is your current skill level in this domain?</h3>
                  <p className="text-xs text-slate-400">This helps set level 1 starting prerequisites.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { level: 'beginner', title: 'Beginner', desc: 'No prior experience; building basics from scratch.' },
                  { level: 'intermediate', title: 'Intermediate', desc: 'Familiar with core syntax and concepts.' },
                  { level: 'advanced', title: 'Advanced', desc: 'Seeking deep architectural and optimization concepts.' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setSkillLevel(item.level as SkillLevel)}
                    className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      skillLevel === item.level
                        ? 'bg-indigo-950/60 border-indigo-500/80 text-slate-100 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-base capitalize">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-2">{item.desc}</p>
                    </div>
                    {skillLevel === item.level && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 mt-4 self-end" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Goal & Time */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">3. Time Commitment & Schedule</h3>
                  <p className="text-xs text-slate-400">Specify your available daily hours and schedule.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-2">
                    Available Hours Per Day: <span className="text-indigo-400 font-bold">{hoursPerDay} hrs</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    step={1}
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>1 hr/day (Micro)</span>
                    <span>3 hrs/day (Balanced)</span>
                    <span>6 hrs/day (Intensive)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Preferred Study Window:</label>
                  <select
                    value={preferredSchedule}
                    onChange={(e) => setPreferredSchedule(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Mornings (7-9 AM)">Mornings (7-9 AM)</option>
                    <option value="Evenings (7-9 PM)">Evenings (7-9 PM)</option>
                    <option value="Late Night (10 PM - 12 AM)">Late Night (10 PM - 12 AM)</option>
                    <option value="Flexible Weekends">Flexible Weekends</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Preferences */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">4. Microlearning Preferences</h3>
                  <p className="text-xs text-slate-400">Select formats you prefer for AI agent content generation.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Interactive Coding Labs',
                  'Video/Audio Lesson Scripts',
                  'Minimal LeetCode-style Practice',
                  'Conceptual Cheat Sheets',
                  'Real-world Case Studies',
                  'Fast-paced Quiz Assessments',
                ].map((pref) => {
                  const selected = preferences.includes(pref);
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => togglePreference(pref)}
                      className={`p-3.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                        selected
                          ? 'bg-indigo-950/60 border-indigo-500/80 text-slate-100'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{pref}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Confirmation */}
          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <BrainCircuit className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">Ready to Create Your Roadmap</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                  Your starter path will cover <strong className="text-indigo-300">{targetDomain}</strong> at the <strong className="text-emerald-400">{skillLevel}</strong> level.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-2 font-mono">
                <p><span className="text-slate-500">Domain:</span> <span className="text-slate-200">{targetDomain}</span></p>
                <p><span className="text-slate-500">Skill Level:</span> <span className="text-slate-200 capitalize">{skillLevel}</span></p>
                <p><span className="text-slate-500">Time:</span> <span className="text-slate-200">{hoursPerDay} hrs/day • {preferredSchedule}</span></p>
                <p><span className="text-slate-500">Passing Threshold:</span> <span className="text-emerald-400 font-bold">85%+ required to unlock levels</span></p>
              </div>
            </div>
          )}

          {/* Wizard Actions */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
            {step > 1 ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep((s) => s - 1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                disabled={isGenerating}
              >
                Previous Step
              </Button>
            ) : <div />}

            {step < totalSteps ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep((s) => s + 1)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                isLoading={isGenerating}
                onClick={handleCompleteOnboarding}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Generate Personalized Roadmap
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
