import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '@/lib/rr';
import { History, Clock, Trash2, Copy, Eye, FileDown, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';
import type { Generation, Question } from '@/types';

export function HistoryPage() {
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGenerations = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('generations')
      .select('*')
      .order('created_at', { ascending: false });
    setGenerations((data as Generation[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGenerations();
  }, [loadGenerations]);

  const handleDelete = async (id: string) => {
    await supabase.from('generations').delete().eq('id', id);
    setGenerations((prev) => prev.filter((g) => g.id !== id));
  };

  const handleDuplicate = async (gen: Generation) => {
    const { data } = await supabase
      .from('generations')
      .insert({
        title: `${gen.title} (Copy)`,
        source_text: gen.source_text,
        language: gen.language,
        question_type: gen.question_type,
        question_count: gen.question_count,
        difficulty: gen.difficulty,
        mcq_options_count: gen.mcq_options_count,
        status: 'completed',
        subject: gen.subject,
        chapter: gen.chapter,
      })
      .select()
      .single();

    if (data) {
      const { data: originalQuestions } = await supabase
        .from('questions')
        .select('*')
        .eq('generation_id', gen.id);

      if (originalQuestions && originalQuestions.length > 0) {
        const newGenId = (data as Generation).id;
        const copiedQuestions = originalQuestions.map((q) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          expected_answer: q.expected_answer,
          answer_points: q.answer_points,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic: q.topic,
          marks: q.marks,
          language: q.language,
          sort_order: q.sort_order,
          is_saved: true,
          generation_id: newGenId,
        }));
        await supabase.from('questions').insert(copiedQuestions);
      }
      loadGenerations();
    }
  };

  const handleOpen = async (gen: Generation) => {
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('generation_id', gen.id)
      .order('sort_order', { ascending: true });

    const qParams = new URLSearchParams();
    qParams.set('gen', gen.id);
    if (questions && questions.length > 0) {
      qParams.set('type', gen.question_type);
    }
    navigate(`/dashboard/bank`);
  };

  const handleExport = async (gen: Generation) => {
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('generation_id', gen.id)
      .order('sort_order', { ascending: true });

    const qs = (questions as Question[]) ?? [];
    let content = `NSAGPT Generation Export\n\n`;
    content += `Title: ${gen.title}\n`;
    content += `Date: ${formatDateTime(gen.created_at)}\n`;
    content += `Language: ${gen.language}\n`;
    content += `Type: ${gen.question_type}\n`;
    content += `Count: ${gen.question_count}\n`;
    content += `Difficulty: ${gen.difficulty}\n\n`;

    if (qs.length > 0) {
      content += `--- Questions ---\n\n`;
      qs.forEach((q, i) => {
        content += `Q${i + 1}. ${q.question_text} [${q.marks} marks]\n`;
        if (q.question_type === 'mcq' && q.options) {
          q.options.forEach((opt, j) => {
            content += `   ${String.fromCharCode(65 + j)}) ${opt.text}\n`;
          });
          content += `   Answer: ${q.correct_answer}\n`;
          if (q.explanation) content += `   Explanation: ${q.explanation}\n`;
        } else if (q.question_type === 'short' && q.expected_answer) {
          content += `   Answer: ${q.expected_answer}\n`;
        } else if (q.question_type === 'long' && q.answer_points) {
          q.answer_points.forEach((pt, j) => {
            content += `   ${j + 1}. ${pt}\n`;
          });
        }
        content += '\n';
      });
    } else {
      content += `--- Source Content ---\n${gen.source_text || 'N/A'}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gen.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1">History</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          View and manage all your past question generations.
        </p>
      </div>

      {generations.length === 0 ? (
        <Card>
          <EmptyState
            icon={<History size={32} />}
            title="No generation history"
            description="Your past question generations will appear here."
            action={<Button onClick={() => navigate('/dashboard/generate')}>Generate Questions</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {generations.map((gen, i) => (
            <Card key={gen.id} className="p-4 sm:p-5 animate-fade-in-up" hover>
              <div style={{ animationDelay: `${i * 0.05}s` }} className="flex items-start gap-4 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center text-primary-500 flex-shrink-0">
                  <Clock size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-800 dark:text-slate-100 truncate">{gen.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDateTime(gen.created_at)}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge variant="primary">{gen.question_type.toUpperCase()}</Badge>
                    <Badge variant="accent">{gen.language}</Badge>
                    <Badge>{gen.question_count} Qs</Badge>
                    <Badge variant="warning">{gen.difficulty}</Badge>
                    {gen.subject && <Badge>{gen.subject}</Badge>}
                    {gen.status === 'completed' && <Badge variant="success">Completed</Badge>}
                    {gen.status === 'pending' && <Badge>Pending</Badge>}
                    {gen.status === 'failed' && <Badge variant="error">Failed</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleOpen(gen)} title="Open in Bank">
                    <Eye size={16} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicate(gen)} title="Duplicate">
                    <Copy size={16} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleExport(gen)} title="Export">
                    <FileDown size={16} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(gen.id)} title="Delete" className="text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
