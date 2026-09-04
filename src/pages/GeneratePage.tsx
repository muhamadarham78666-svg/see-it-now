import { useSearchParams } from '@/lib/rr';
import { useState, useEffect, useMemo } from 'react';
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
  Eye,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Button } from '@/components/nsa/Button';
import { Badge } from '@/components/nsa/Badge';
import { SegmentedControl } from '@/components/nsa/Toggle';
import { FileUpload } from '@/components/generator/FileUpload';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { QuestionEditModal } from '@/components/questions/QuestionEditModal';
import { PaperPreviewModal } from '@/components/questions/PaperPreviewModal';
import { BoardSelector } from '@/components/boards/BoardSelector';
import { useBoard } from '@/context/BoardContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { questionGenerator, type GenAttachment } from '@/services/aiService';
import type { QuestionType, Language, Difficulty, Question } from '@/types';
import type { Json } from '@/integrations/supabase/types';

const processingSteps = [
  { label: 'Analyzing Content', icon: ScanSearch },
  { label: 'Identifying Important Topics', icon: Zap },
  { label: 'Generating Questions', icon: Sparkles },
  { label: 'Checking Quality', icon: CheckCircle },
  { label: 'Finalizing', icon: FileText },
];

export function GeneratePage() {
  const { profile, session } = useAuth();
  const { board } = useBoard();
  const [searchParams] = useSearchParams();

  // --- Curriculum selection (Class/Group -> Book -> Range) ---
  const [groupKey, setGroupKey] = useState<string>('');
  const [bookId, setBookId] = useState<string>('');
  const [range, setRange] = useState<PaperRange>('full');
  const [pickedChapters, setPickedChapters] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const group = useMemo(() => findGroup(groupKey), [groupKey]);
  const bookObj = useMemo(() => findBook(groupKey, bookId), [groupKey, bookId]);
  const pattern = useMemo(
    () => (group && bookObj ? resolvePattern(group, bookObj) : null),
    [group, bookObj],
  );
  const rangeChapters = useMemo(
    () => (bookObj ? chaptersForRange(bookObj.chapters, range, pickedChapters) : []),
    [bookObj, range, pickedChapters],
  );

  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<GenAttachment[]>([]);
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
  const [mixCounts, setMixCounts] = useState({ mcq: 10, short: 3, long: 1 });

  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);

  const countPresets = [10, 20, 50, 100, 200];
  const mcqOptionsPresets = [2, 3, 4, 5, 6];
  const isMixed = questionType === 'mixed';
  const mixTotal = mixCounts.mcq + mixCounts.short + mixCounts.long;

  const effectiveCount = useMemo(() => {
    if (isMixed) return mixTotal;
    const custom = parseInt(customCount, 10);
    return Number.isFinite(custom) && custom > 0 ? custom : questionCount;
  }, [isMixed, mixTotal, customCount, questionCount]);

  const hasMaterial = content.trim().length > 0 || attachments.length > 0;

  useEffect(() => {
    if (profile?.preferences) {
      const p = profile.preferences;
      if (!searchParams.get('type') && p.defaultQuestionType) setQuestionType(p.defaultQuestionType);
      if (p.language) setLanguage(p.language);
      if (p.defaultDifficulty) setDifficulty(p.defaultDifficulty);
      if (p.defaultQuestionCount) setQuestionCount(p.defaultQuestionCount);
    }
  }, [profile, searchParams]);

  // Animate the processing steps while the AI request is in flight.
  useEffect(() => {
    if (!generating) return;
    const timer = setInterval(() => {
      setCurrentStep((s) => (s < processingSteps.length - 2 ? s + 1 : s));
    }, 2500);
    return () => clearInterval(timer);
  }, [generating]);

  const handleGenerate = async () => {
    if (!hasMaterial) {
      setError('Please upload a file or paste some content first.');
      return;
    }
    if (isMixed && mixTotal < 1) {
      setError('Set at least one question for MCQ, Short or Long.');
      return;
    }

    setError(null);
    setNotice(null);
    setGenerating(true);
    setCurrentStep(0);
    setGeneratedQuestions([]);

    const settings = {
      language,
      questionType,
      questionCount: effectiveCount,
      difficulty,
      mcqOptionsCount: mcqOptions,
      typeCounts: isMixed ? mixCounts : null,
      subject: subject || undefined,
      chapter: chapter || undefined,
    };

    try {
      const questions = await questionGenerator.generate(content, attachments, settings);
      setCurrentStep(processingSteps.length - 1);

      const questionLanguage: Question['language'] = language;
      let finalQuestions = questionGenerator.toLocalQuestions(questions, questionLanguage);

      if (session) {
        try {
          const { data: genData } = await supabase
            .from('generations')
            .insert({
              user_id: session.user.id,
              title: title || `Generation ${new Date().toLocaleDateString()}`,
              source_text: content || null,
              source_file_name: attachments[0]?.name ?? null,
              source_file_type: attachments[0]?.mime ?? null,
              language,
              question_type: questionType,
              question_count: effectiveCount,
              difficulty,
              mcq_options_count: mcqOptions,
              status: 'completed',
              subject: subject || null,
              chapter: chapter || null,
            })
            .select()
            .single();

          const saved = await questionGenerator.saveQuestions(
            session.user.id,
            genData?.id ?? null,
            questions,
            questionLanguage,
          );
          if (saved.length) finalQuestions = saved;
        } catch {
          setNotice('Questions are ready, but could not be saved to your library right now.');
        }
      }

      setGeneratedQuestions(finalQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const isPersisted = (id: string) => !id.startsWith('local-');

  const handleDelete = async (id: string) => {
    if (isPersisted(id)) await supabase.from('questions').delete().eq('id', id);
    setGeneratedQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleEdit = (question: Question) => setEditQuestion(question);

  const handleSaveEdit = async (updated: Question) => {
    if (isPersisted(updated.id)) {
      const { error: updateError } = await supabase
        .from('questions')
        .update({
          question_text: updated.question_text,
          options: updated.options as Json,
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
    }
    setGeneratedQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    setEditQuestion(null);
  };

  const handleDuplicate = async (question: Question) => {
    const copy: Question = {
      ...question,
      id: `local-${Date.now()}`,
      sort_order: generatedQuestions.length,
    };
    setGeneratedQuestions((prev) => [...prev, copy]);
  };

  const move = (id: string, dir: -1 | 1) => {
    setGeneratedQuestions((prev) => {
      const i = prev.findIndex((q) => q.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const navigateToPaper = () => {
    const ids = Array.from(selectedIds).filter(isPersisted);
    if (ids.length === 0) {
      setError('Save-able questions only — these questions are not stored in your library yet.');
      return;
    }
    window.location.href = `/dashboard/papers?questionIds=${encodeURIComponent(ids.join(','))}`;
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
            Reading your material and generating high-quality questions...
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
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    done
                      ? 'bg-success-500 text-white'
                      : active
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {done ? <CheckCircle size={20} /> : active ? <Loader2 size={20} className="animate-spin" /> : <Icon size={20} />}
                </div>
                <span
                  className={`text-sm font-medium ${
                    done
                      ? 'text-success-700 dark:text-success-400'
                      : active
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-slate-500'
                  }`}
                >
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
    const totalMarks = generatedQuestions.reduce((s, q) => s + (q.marks || 0), 0);
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Generated Questions
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {generatedQuestions.length} questions • {totalMarks} total marks
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.size > 0 && (
              <Button variant="secondary" onClick={navigateToPaper}>
                <Newspaper size={16} /> Add {selectedIds.size} to Paper
              </Button>
            )}
            <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
              <Eye size={16} /> Preview &amp; Download
            </Button>
            <Button
              onClick={() => {
                setGeneratedQuestions([]);
                setSelectedIds(new Set());
              }}
            >
              Generate More
            </Button>
          </div>
        </div>

        {notice && (
          <div className="p-4 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/50 text-warning-700 dark:text-warning-400 text-sm">
            {notice}
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/50 text-error-700 dark:text-error-400 text-sm">
            {error}
          </div>
        )}

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
              onMoveUp={(id) => move(id, -1)}
              onMoveDown={(id) => move(id, 1)}
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

        <PaperPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          questions={generatedQuestions}
          defaultMeta={{
            title: title || 'Question Paper',
            subject,
            chapter,
            examName: title || 'Question Paper',
            className: classLevel ?? '',
            boardName: board?.name ?? '',
            boardStyle: board?.style ?? 'punjab',
            instructions: 'Attempt all questions. Write answers clearly.',
          }}
        />
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
          Upload any file — PDF, DOC, TXT or an image of a book page — and let AI build your questions.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/50 text-error-700 dark:text-error-400 text-sm animate-fade-in">
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

            <FileUpload onAttachmentsChange={setAttachments} />

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
                className="input-field resize-y font-sans text-left"
              />
              <p className="text-xs text-slate-400 mt-1">
                {content.length.toLocaleString()} characters
                {attachments.length > 0 && ` • ${attachments.length} file(s) attached`}
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

              {/* Mixed: per-type counts */}
              {isMixed && (
                <div className="rounded-xl border border-primary-200 dark:border-primary-800/50 bg-primary-50/60 dark:bg-primary-900/20 p-4 space-y-3 animate-fade-in-down">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-primary-500" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      How many of each type?
                    </p>
                  </div>
                  {([
                    { key: 'mcq' as const, label: 'MCQ' },
                    { key: 'short' as const, label: 'Short Questions' },
                    { key: 'long' as const, label: 'Long Questions' },
                  ]).map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setMixCounts((c) => ({ ...c, [key]: Math.max(0, c[key] - 1) }))
                          }
                          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={mixCounts[key]}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            setMixCounts((c) => ({ ...c, [key]: Number.isFinite(n) && n > 0 ? n : 0 }));
                          }}
                          className="w-16 h-8 text-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => setMixCounts((c) => ({ ...c, [key]: c[key] + 1 }))}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-primary-200/60 dark:border-primary-800/40">
                    Total: <span className="font-semibold">{mixTotal}</span> questions
                  </p>
                </div>
              )}

              {/* Board & class — drives the exam paper style */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4">
                <BoardSelector />
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

              {/* Question Count (hidden in mixed mode) */}
              {!isMixed && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Hash size={16} className="text-slate-400" />
                    Number of Questions
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {countPresets.map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setQuestionCount(n);
                          setCustomCount('');
                        }}
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
              )}

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
              {(questionType === 'mcq' || (isMixed && mixCounts.mcq > 0)) && (
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

          <Button onClick={handleGenerate} size="lg" className="w-full" disabled={!hasMaterial}>
            <Sparkles size={18} />
            Generate Questions
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="primary">{questionType.toUpperCase()}</Badge>
            <Badge variant="accent">{language}</Badge>
            <Badge>{effectiveCount} Questions</Badge>
            <Badge variant="warning">{difficulty}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
