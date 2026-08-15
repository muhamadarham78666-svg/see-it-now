import { useSearchParams } from '@/lib/rr';
import { useState, useEffect } from 'react';
import {
  Sparkles,
  Settings2,
  FileText,
  Type,
  Languages,
  Hash,
  Gauge,
  ListOrdered,
  Loader2,
  ScanSearch,
  CheckCircle,
  Zap,
  Newspaper,
} from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Button } from '@/components/nsa/Button';
import { Badge } from '@/components/nsa/Badge';
import { SegmentedControl } from '@/components/nsa/Toggle';
import { FileUpload } from '@/components/generator/FileUpload';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { QuestionEditModal } from '@/components/questions/QuestionEditModal';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { questionGenerator } from '@/services/aiService';
import type { QuestionType, Language, Difficulty, Question } from '@/types';

const processingSteps = [
  { label: 'Analyzing Content', icon: ScanSearch },
  { label: 'Identifying Important Topics', icon: Zap },
  { label: 'Generating Questions', icon: Sparkles },
  { label: 'Checking Quality', icon: CheckCircle },
  { label: 'Finalizing', icon: FileText },
];

export function GeneratePage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();

  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>(
    (searchParams.get('type') as QuestionType) || 'mcq',
  );
  const [language, setLanguage] = useState<Language>('english');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customCount, setCustomCount] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [mcqOptions, setMcqOptions] = useState(4);

  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const countPresets = [10, 20, 50, 100, 200];
  const mcqOptionsPresets = [2, 3, 4, 5, 6];

  useEffect(() => {
    if (profile?.preferences) {
      const p = profile.preferences;
      if (!searchParams.get('type') && p.defaultQuestionType) {
        setQuestionType(p.defaultQuestionType);
      }
      if (p.language) setLanguage(p.language);
      if (p.defaultDifficulty) setDifficulty(p.defaultDifficulty);
      if (p.defaultQuestionCount) {
        setQuestionCount(p.defaultQuestionCount);
      }
    }
  }, [profile, searchParams]);

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please provide content by uploading a file or pasting text.');
      return;
    }
    if (!profile) return;

    setError(null);
    setGenerating(true);
    setCurrentStep(0);
    setGeneratedQuestions([]);

    const effectiveCount = customCount ? parseInt(customCount) : questionCount;

    try {
      // Create generation record
      const { data: genData, error: genError } = await supabase
        .from('generations')
        .insert({
          user_id: profile.id,
          title: title || `Generation ${new Date().toLocaleDateString()}`,
          source_text: content,
          language,
          question_type: questionType,
          question_count: effectiveCount,
          difficulty,
          mcq_options_count: mcqOptions,
          status: 'analyzing',
          subject: subject || null,
          chapter: chapter || null,
        })
        .select()
        .single();

      if (genError) throw genError;

      const settings = {
        language,
        questionType,
        questionCount: effectiveCount,
        difficulty,
        mcqOptionsCount: mcqOptions,
      };

      const questions = await questionGenerator.generate(content, settings, (step) => {
        const idx = processingSteps.findIndex((s) => s.label === step);
        if (idx >= 0) setCurrentStep(idx);
      });

      // Save questions
      const savedQuestions = await questionGenerator.saveQuestions(
        profile.id,
        genData.id,
        questions,
      );

      // Update generation status
      await supabase
        .from('generations')
        .update({ status: 'completed' })
        .eq('id', genData.id);

      setGeneratedQuestions(savedQuestions);
      setCurrentStep(processingSteps.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('questions').delete().eq('id', id);
    setGeneratedQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleEdit = (question: Question) => {
    setEditQuestion(question);
  };

  const handleSaveEdit = async (updated: Question) => {
    const { error: updateError } = await supabase
      .from('questions')
      .update({
        question_text: updated.question_text,
        options: updated.options,
        correct_answer: updated.correct_answer,
        expected_answer: updated.expected_answer,
        answer_points: updated.answer_points,
        explanation: updated.explanation,
        difficulty: updated.difficulty,
        topic: updated.topic,
        marks: updated.marks,
      })
      .eq('id', updated.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setGeneratedQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    setEditQuestion(null);
  };

  const handleDuplicate = async (question: Question) => {
    const { data, error: dupError } = await supabase
      .from('questions')
      .insert({
        user_id: profile!.id,
        generation_id: question.generation_id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options,
        correct_answer: question.correct_answer,
        expected_answer: question.expected_answer,
        answer_points: question.answer_points,
        explanation: question.explanation,
        difficulty: question.difficulty,
        topic: question.topic,
        marks: question.marks,
        language: question.language,
        sort_order: generatedQuestions.length,
        is_saved: true,
      })
      .select()
      .single();

    if (dupError) {
      setError(dupError.message);
      return;
    }

    setGeneratedQuestions((prev) => [...prev, data as Question]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelectedToPaper = () => {
    if (selectedIds.size === 0) return;
    const params = new URLSearchParams();
    params.set('questionIds', Array.from(selectedIds).join(','));
    window.location.href = `/dashboard/papers?${params.toString()}`;
  };

  const navigateToPaper = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).join(',');
    window.location.href = `/dashboard/papers?questionIds=${encodeURIComponent(ids)}`;
  };

  if (generating) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-12">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 items-center justify-center text-white mb-6 shadow-lg shadow-primary-500/30 animate-pulse-glow">
            <Sparkles size={36} />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">
            AI is Working on Your Questions
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Analyzing your content and generating high-quality questions...
          </p>
        </div>

        <div className="space-y-3">
          {processingSteps.map((step, i) => {
            const Icon = step.icon;
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                  done
                    ? 'border-success-200 dark:border-success-800/50 bg-success-50 dark:bg-success-900/20'
                    : active
                    ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  done ? 'bg-success-500 text-white' : active ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }`}>
                  {done ? <CheckCircle size={20} /> : active ? <Loader2 size={20} className="animate-spin" /> : <Icon size={20} />}
                </div>
                <span className={`text-sm font-medium ${
                  done ? 'text-success-700 dark:text-success-400' : active ? 'text-primary-700 dark:text-primary-300' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (generatedQuestions.length > 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Generated Questions
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {generatedQuestions.length} questions generated successfully
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.size > 0 && (
              <Button variant="secondary" onClick={navigateToPaper}>
                <Newspaper size={16} /> Add {selectedIds.size} to Paper
              </Button>
            )}
            <Button onClick={() => { setGeneratedQuestions([]); setContent(''); setSelectedIds(new Set()); }}>
              Generate More
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {generatedQuestions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              selected={selectedIds.has(q.id)}
              onSelect={toggleSelect}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>

        {editQuestion && (
          <QuestionEditModal
            question={editQuestion}
            onSave={handleSaveEdit}
            onClose={() => setEditQuestion(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Generate Questions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload your study material, configure settings, and let AI generate questions.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/50 text-error-700 dark:text-error-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-primary-500" />
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Study Material
              </h2>
            </div>

            <FileUpload onContentExtracted={(c, name) => { setContent(c); setFileName(name); }} />

            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">OR</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Paste or Write Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Paste your study material, chapter text, or notes here..."
                className="input-field resize-y font-sans"
              />
              <p className="text-xs text-slate-400 mt-1">
                {content.length.toLocaleString()} characters
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Type size={20} className="text-accent-500" />
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Generation Details
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional title" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Chapter</label>
                <input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Chapter 1" className="input-field" />
              </div>
            </div>
          </Card>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Settings2 size={20} className="text-primary-500" />
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Settings
              </h2>
            </div>

            <div className="space-y-5">
              {/* Question Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <ListOrdered size={16} className="text-slate-400" />
                  Question Type
                </label>
                <SegmentedControl
                  value={questionType}
                  onChange={setQuestionType}
                  options={[
                    { value: 'mcq', label: 'MCQ' },
                    { value: 'short', label: 'Short' },
                    { value: 'long', label: 'Long' },
                    { value: 'mixed', label: 'Mixed' },
                  ]}
                />
              </div>

              {/* Language */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Languages size={16} className="text-slate-400" />
                  Language
                </label>
                <SegmentedControl
                  value={language}
                  onChange={setLanguage}
                  options={[
                    { value: 'english', label: 'English' },
                    { value: 'urdu', label: 'Urdu' },
                    { value: 'mixed', label: 'Mixed' },
                  ]}
                />
              </div>

              {/* Question Count */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Hash size={16} className="text-slate-400" />
                  Number of Questions
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {countPresets.map((n) => (
                    <button
                      key={n}
                      onClick={() => { setQuestionCount(n); setCustomCount(''); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        !customCount && questionCount === n
                          ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md shadow-primary-500/25'
                          : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                  placeholder="Custom count"
                  className="input-field"
                  min={1}
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Gauge size={16} className="text-slate-400" />
                  Difficulty
                </label>
                <SegmentedControl
                  value={difficulty}
                  onChange={setDifficulty}
                  options={[
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                    { value: 'mixed', label: 'Mixed' },
                  ]}
                />
              </div>

              {/* MCQ Options */}
              {questionType !== 'short' && questionType !== 'long' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    MCQ Options Count
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {mcqOptionsPresets.map((n) => (
                      <button
                        key={n}
                        onClick={() => setMcqOptions(n)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          mcqOptions === n
                            ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md shadow-primary-500/25'
                            : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Button onClick={handleGenerate} size="lg" className="w-full">
            <Sparkles size={18} />
            Generate Questions
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="primary">{questionType.toUpperCase()}</Badge>
            <Badge variant="accent">{language}</Badge>
            <Badge>{customCount || questionCount} Questions</Badge>
            <Badge variant="warning">{difficulty}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
