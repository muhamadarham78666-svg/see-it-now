import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '@/lib/rr';
import { Search, Filter, Archive, Plus, Trash2, Newspaper, X, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { QuestionEditModal } from '@/components/questions/QuestionEditModal';
import { supabase } from '@/lib/supabase';
import type { Question, QuestionType, Difficulty, Language } from '@/types';

export function QuestionBankPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<QuestionType | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all');
  const [filterLanguage, setFilterLanguage] = useState<Language | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('questions').select('*').eq('is_saved', true).order('created_at', { ascending: false });

    if (filterType !== 'all') query = query.eq('question_type', filterType);
    if (filterDifficulty !== 'all') query = query.eq('difficulty', filterDifficulty);
    if (filterLanguage !== 'all') query = query.eq('language', filterLanguage);
    if (search) query = query.or(`question_text.ilike.%${search}%,topic.ilike.%${search}%`);

    const { data } = await query;
    setQuestions((data as Question[]) ?? []);
    setLoading(false);
  }, [filterType, filterDifficulty, filterLanguage, search]);

  useEffect(() => {
    const timeout = setTimeout(loadQuestions, 300);
    return () => clearTimeout(timeout);
  }, [loadQuestions]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    await supabase.from('questions').delete().eq('id', id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    await supabase.from('questions').delete().in('id', Array.from(selectedIds));
    setQuestions((prev) => prev.filter((q) => !selectedIds.has(q.id)));
    setSelectedIds(new Set());
  };

  const handleAddToPaper = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).join(',');
    navigate(`/dashboard/papers?questionIds=${encodeURIComponent(ids)}`);
  };

  const handleDuplicate = async (question: Question) => {
    const { data } = await supabase
      .from('questions')
      .insert({
        user_id: question.user_id,
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
        sort_order: questions.length,
        is_saved: true,
      })
      .select()
      .single();
    if (data) setQuestions((prev) => [data as Question, ...prev]);
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

    if (updateError) return;
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    setEditQuestion(null);
  };

  const handleExportSelected = () => {
    const selected = questions.filter((q) => selectedIds.has(q.id));
    const text = selected.map((q, i) => {
      let s = `Q${i + 1}. ${q.question_text} [${q.marks} marks]\n`;
      if (q.question_type === 'mcq' && q.options) {
        q.options.forEach((opt, j) => { s += `   ${String.fromCharCode(65 + j)}) ${opt.text}\n`; });
      }
      return s;
    }).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_bank_export.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1">Question Bank</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Browse, search, and manage all your saved questions.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/generate')}>
          <Plus size={18} /> Generate New
        </Button>
      </div>

      {/* Search & filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions or topics..."
              className="input-field pl-11"
            />
          </div>
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} /> Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid sm:grid-cols-3 gap-3 mt-4 animate-fade-in">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as QuestionType | 'all')} className="input-field">
              <option value="all">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="short">Short</option>
              <option value="long">Long</option>
            </select>
            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | 'all')} className="input-field">
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value as Language | 'all')} className="input-field">
              <option value="all">All Languages</option>
              <option value="english">English</option>
              <option value="urdu">Urdu</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        )}
      </Card>

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 animate-fade-in">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAddToPaper}>
              <Newspaper size={16} /> Add to Paper
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExportSelected}>
              <Download size={16} /> Export
            </Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>
              <Trash2 size={16} /> Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              <X size={16} /> Clear
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Archive size={32} />}
            title="No questions found"
            description="Generate questions from your study material to populate your question bank."
            action={<Button onClick={() => navigate('/dashboard/generate')}><Plus size={16} /> Generate Questions</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">{questions.length} questions</p>
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              selected={selectedIds.has(q.id)}
              onSelect={toggleSelect}
              onDelete={handleDelete}
              onEdit={setEditQuestion}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

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
