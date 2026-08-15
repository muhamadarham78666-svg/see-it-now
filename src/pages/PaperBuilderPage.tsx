import { useEffect, useState } from 'react';
import { useSearchParams } from '@/lib/rr';
import {
  Newspaper,
  Plus,
  Trash2,
  Printer,
  Eye,
  Save,
  Download,
  FileText,
  Copy,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Button } from '@/components/nsa/Button';
import { Badge } from '@/components/nsa/Badge';
import { Spinner, EmptyState } from '@/components/nsa/Feedback';
import { Modal } from '@/components/nsa/Modal';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getLetterLabel } from '@/lib/utils';
import type { Paper, Question, PaperQuestion } from '@/types';

type Template = 'classic' | 'modern' | 'premium';

interface PaperSection {
  id: string;
  name: string;
  questionType: 'mcq' | 'short' | 'long';
  questionIds: string[];
}

export function PaperBuilderPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const incomingQuestionIds = searchParams.get('questionIds')?.split(',').filter(Boolean) ?? [];

  const [papers, setPapers] = useState<Paper[]>([]);
  const [activePaper, setActivePaper] = useState<Paper | null>(null);
  const [paperQuestions, setPaperQuestions] = useState<PaperQuestion[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [template, setTemplate] = useState<Template>('classic');
  const [autoSectioned, setAutoSectioned] = useState(true);

  const [form, setForm] = useState({
    title: '',
    institution_name: '',
    subject: '',
    class_name: '',
    chapter: '',
    exam_name: '',
    exam_date: '',
    exam_time: '',
    total_marks: 100,
    instructions: 'Attempt all questions. Write neatly and clearly.',
  });

  useEffect(() => {
    loadPapers();
    loadAvailableQuestions();
  }, []);

  useEffect(() => {
    if (incomingQuestionIds.length > 0 && papers.length > 0 && activePaper) {
      addQuestionsToPaper(activePaper.id, incomingQuestionIds);
    }
  }, [incomingQuestionIds, papers, activePaper]);

  const loadPapers = async () => {
    const { data } = await supabase.from('papers').select('*').order('created_at', { ascending: false });
    setPapers((data as Paper[]) ?? []);
    if (data && data.length > 0) {
      setActivePaper(data[0] as Paper);
      loadPaperQuestions(data[0].id);
    }
    setLoading(false);
  };

  const loadPaperQuestions = async (paperId: string) => {
    const { data } = await supabase
      .from('paper_questions')
      .select('*, question:questions(*)')
      .eq('paper_id', paperId)
      .order('sort_order', { ascending: true });
    setPaperQuestions((data as PaperQuestion[]) ?? []);
  };

  const loadAvailableQuestions = async () => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('is_saved', true)
      .order('created_at', { ascending: false });
    setAvailableQuestions((data as Question[]) ?? []);
  };

  const handleCreatePaper = async () => {
    if (!profile || !form.title) return;
    const { data, error } = await supabase
      .from('papers')
      .insert({
        user_id: profile.id,
        ...form,
        exam_date: form.exam_date || null,
        status: 'draft',
      })
      .select()
      .single();

    if (!error && data) {
      const newPaper = data as Paper;
      setPapers((prev) => [newPaper, ...prev]);
      setActivePaper(newPaper);
      setPaperQuestions([]);
      setShowNewModal(false);
      setForm({
        title: '', institution_name: '', subject: '', class_name: '', chapter: '',
        exam_name: '', exam_date: '', exam_time: '', total_marks: 100,
        instructions: 'Attempt all questions. Write neatly and clearly.',
      });
    }
  };

  const addQuestionsToPaper = async (paperId: string, questionIds: string[]) => {
    const existing = paperQuestions.map((pq) => pq.question_id);
    const toAdd = questionIds.filter((id) => !existing.includes(id));
    if (toAdd.length === 0 || !profile) return;

    const startOrder = paperQuestions.length;
    const rows = toAdd.map((qid, i) => ({
      paper_id: paperId,
      question_id: qid,
      user_id: profile.id,
      sort_order: startOrder + i,
      marks: 5,
    }));

    const { data } = await supabase.from('paper_questions').insert(rows).select('*, question:questions(*)');
    if (data) {
      setPaperQuestions((prev) => [...prev, ...(data as PaperQuestion[])]);
    }
  };

  const handleAddQuestion = (questionId: string) => {
    if (activePaper) addQuestionsToPaper(activePaper.id, [questionId]);
  };

  const handleRemoveQuestion = async (pqId: string) => {
    await supabase.from('paper_questions').delete().eq('id', pqId);
    setPaperQuestions((prev) => prev.filter((pq) => pq.id !== pqId));
  };

  const handleMove = async (pqId: string, direction: 'up' | 'down') => {
    const sorted = [...paperQuestions].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((pq) => pq.id === pqId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapIdx];
    await Promise.all([
      supabase.from('paper_questions').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('paper_questions').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    loadPaperQuestions(activePaper!.id);
  };

  const handleUpdateMarks = async (pqId: string, marks: number) => {
    await supabase.from('paper_questions').update({ marks }).eq('id', pqId);
    setPaperQuestions((prev) => prev.map((pq) => (pq.id === pqId ? { ...pq, marks } : pq)));
  };

  const totalMarks = paperQuestions.reduce((sum, pq) => sum + pq.marks, 0);

  const getSections = (): PaperSection[] => {
    if (!autoSectioned) {
      return [{
        id: 'all',
        name: 'Questions',
        questionType: 'mcq',
        questionIds: paperQuestions.map((pq) => pq.id),
      }];
    }
    const sections: PaperSection[] = [
      { id: 'mcq', name: 'Section A — MCQs', questionType: 'mcq', questionIds: [] },
      { id: 'short', name: 'Section B — Short Questions', questionType: 'short', questionIds: [] },
      { id: 'long', name: 'Section C — Long Questions', questionType: 'long', questionIds: [] },
    ];
    paperQuestions.forEach((pq) => {
      if (pq.question) {
        const sec = sections.find((s) => s.questionType === pq.question!.question_type);
        if (sec) sec.questionIds.push(pq.id);
      }
    });
    return sections.filter((s) => s.questionIds.length > 0);
  };

  const handleExportPDF = () => {
    if (!activePaper) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(generatePaperHTML(activePaper, paperQuestions, totalMarks, template));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleExportTXT = () => {
    if (!activePaper) return;
    const text = generatePaperText(activePaper, paperQuestions, totalMarks);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePaper.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPaper = async () => {
    if (!activePaper) return;
    const text = generatePaperText(activePaper, paperQuestions, totalMarks);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard may be blocked
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1">Question Papers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Build professional exam papers from your questions.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {activePaper && (
            <>
              <Button variant="secondary" onClick={() => setShowPreview(true)}>
                <Eye size={18} /> Preview
              </Button>
              <Button variant="secondary" onClick={handleExportPDF}>
                <Printer size={18} /> Print / PDF
              </Button>
              <Button variant="secondary" onClick={handleExportTXT}>
                <Download size={18} /> TXT
              </Button>
              <Button variant="secondary" onClick={handleCopyPaper}>
                <Copy size={18} /> Copy
              </Button>
            </>
          )}
          <Button onClick={() => setShowNewModal(true)}>
            <Plus size={18} /> New Paper
          </Button>
        </div>
      </div>

      {/* Paper selector */}
      {papers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {papers.map((p) => (
            <button
              key={p.id}
              onClick={() => { setActivePaper(p); loadPaperQuestions(p.id); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activePaper?.id === p.id
                  ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md shadow-primary-500/25'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-300'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      {/* Template selector */}
      {activePaper && (
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Template:</span>
            {(['classic', 'modern', 'premium'] as Template[]).map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  template === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {t === 'classic' ? 'Classic Academic' : t === 'modern' ? 'Modern Academy' : 'Premium'}
              </button>
            ))}
            <label className="flex items-center gap-2 ml-auto text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={autoSectioned}
                onChange={(e) => setAutoSectioned(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/50"
              />
              Auto-section by type
            </label>
          </div>
        </Card>
      )}

      {!activePaper ? (
        <Card>
          <EmptyState
            icon={<Newspaper size={32} />}
            title="No question papers yet"
            description="Create a new paper to start building your professional exam paper."
            action={<Button onClick={() => setShowNewModal(true)}><Plus size={16} /> Create Paper</Button>}
          />
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Paper info */}
          <Card className="p-5 lg:col-span-1">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-4">Paper Information</h3>
            <div className="space-y-3 text-sm">
              <InfoRow label="Institution" value={activePaper.institution_name} />
              <InfoRow label="Subject" value={activePaper.subject} />
              <InfoRow label="Class" value={activePaper.class_name} />
              <InfoRow label="Chapter" value={activePaper.chapter} />
              <InfoRow label="Exam Name" value={activePaper.exam_name} />
              <InfoRow label="Date" value={activePaper.exam_date} />
              <InfoRow label="Time" value={activePaper.exam_time} />
              <InfoRow label="Total Marks" value={String(totalMarks)} />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <Button className="w-full" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Add Questions
              </Button>
            </div>
          </Card>

          {/* Questions list with sections */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Questions ({paperQuestions.length})
              </h3>
              <Badge variant="primary">Total: {totalMarks} marks</Badge>
            </div>

            {paperQuestions.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Plus size={32} />}
                  title="No questions added"
                  description="Add questions from your question bank to build this paper."
                  action={<Button onClick={() => setShowAddModal(true)}><Plus size={16} /> Add Questions</Button>}
                />
              </Card>
            ) : (
              getSections().map((section) => {
                const sectionPqs = paperQuestions.filter((pq) => section.questionIds.includes(pq.id));
                return (
                  <div key={section.id}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <h4 className="font-display text-sm font-bold text-slate-800 dark:text-slate-200">{section.name}</h4>
                      <Badge>{sectionPqs.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {sectionPqs.map((pq, i) => (
                        <div key={pq.id} className="relative card p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-slate-400">Q{i + 1}</span>
                            <input
                              type="number"
                              value={pq.marks}
                              onChange={(e) => handleUpdateMarks(pq.id, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                            <span className="text-xs text-slate-400">marks</span>
                            <div className="ml-auto flex items-center gap-1">
                              <button onClick={() => handleMove(pq.id, 'up')} className="p-1 rounded text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                                <ChevronUp size={16} />
                              </button>
                              <button onClick={() => handleMove(pq.id, 'down')} className="p-1 rounded text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                                <ChevronDown size={16} />
                              </button>
                              <button onClick={() => handleRemoveQuestion(pq.id)} className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {pq.question && (
                            <QuestionCard question={pq.question} index={i} showControls={false} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Questions Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Questions from Bank" size="xl">
        {availableQuestions.length === 0 ? (
          <EmptyState
            icon={<Plus size={32} />}
            title="No questions available"
            description="Generate questions first to add them to your paper."
          />
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin">
            {availableQuestions.map((q, i) => {
              const alreadyAdded = paperQuestions.some((pq) => pq.question_id === q.id);
              return (
                <div key={q.id} className="flex items-start gap-3">
                  <div className="flex-1">
                    <QuestionCard question={q} index={i} showControls={false} />
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyAdded ? 'secondary' : 'primary'}
                    disabled={alreadyAdded}
                    onClick={() => handleAddQuestion(q.id)}
                    className="mt-2 flex-shrink-0"
                  >
                    {alreadyAdded ? 'Added' : 'Add'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* New Paper Modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Create New Paper" size="lg">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Paper Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Field label="Institution / School" value={form.institution_name} onChange={(v) => setForm({ ...form, institution_name: v })} />
          <Field label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
          <Field label="Class" value={form.class_name} onChange={(v) => setForm({ ...form, class_name: v })} />
          <Field label="Chapter" value={form.chapter} onChange={(v) => setForm({ ...form, chapter: v })} />
          <Field label="Exam / Test Name" value={form.exam_name} onChange={(v) => setForm({ ...form, exam_name: v })} />
          <Field label="Date" type="date" value={form.exam_date} onChange={(v) => setForm({ ...form, exam_date: v })} />
          <Field label="Time" value={form.exam_time} onChange={(v) => setForm({ ...form, exam_time: v })} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Instructions</label>
          <textarea
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            rows={3}
            className="input-field resize-y"
            placeholder="e.g. Attempt all questions. Write neatly..."
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleCreatePaper} disabled={!form.title}>
            <Save size={18} /> Create Paper
          </Button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Paper Preview" size="xl">
        <PaperPreview paper={activePaper} questions={paperQuestions} totalMarks={totalMarks} template={template} autoSectioned={autoSectioned} />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={handleExportTXT}>
            <FileText size={16} /> Export TXT
          </Button>
          <Button onClick={handleExportPDF}>
            <Printer size={16} /> Print / PDF
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 dark:text-slate-200">{value || '—'}</span>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input-field" required={required} />
    </div>
  );
}

function PaperPreview({ paper, questions, totalMarks, template, autoSectioned }: {
  paper: Paper | null;
  questions: PaperQuestion[];
  totalMarks: number;
  template: Template;
  autoSectioned: boolean;
}) {
  if (!paper) return null;

  const templateClass = template === 'classic' ? 'font-serif' : template === 'modern' ? 'font-sans' : 'font-serif';
  const headerBorder = template === 'premium' ? 'border-b-4 border-double border-black' : 'border-b-2 border-black';

  const sections: { name: string; type: string; items: PaperQuestion[] }[] = autoSectioned
    ? [
        { name: 'Section A — Multiple Choice Questions', type: 'mcq', items: questions.filter((pq) => pq.question?.question_type === 'mcq') },
        { name: 'Section B — Short Questions', type: 'short', items: questions.filter((pq) => pq.question?.question_type === 'short') },
        { name: 'Section C — Long Questions', type: 'long', items: questions.filter((pq) => pq.question?.question_type === 'long') },
      ].filter((s) => s.items.length > 0)
    : [{ name: 'Questions', type: 'all', items: questions }];

  return (
    <div className={`bg-white text-black p-8 rounded-lg ${templateClass}`} dir="auto">
      <div className={`text-center ${headerBorder} pb-4 mb-6`}>
        {paper.institution_name && <h1 className="text-2xl font-bold mb-1">{paper.institution_name}</h1>}
        <h2 className="text-lg font-semibold">{paper.exam_name || 'Examination'}</h2>
        <div className="flex flex-wrap justify-between gap-2 text-sm mt-2">
          <span>Subject: {paper.subject || '—'}</span>
          <span>Class: {paper.class_name || '—'}</span>
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-sm mt-1">
          <span>Date: {paper.exam_date || '—'}</span>
          <span>Time: {paper.exam_time || '—'}</span>
          <span>Total Marks: {totalMarks}</span>
        </div>
      </div>

      {paper.instructions && (
        <div className="mb-6 text-sm">
          <p className="font-semibold mb-1">Instructions:</p>
          <p className="text-gray-700">{paper.instructions}</p>
        </div>
      )}

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.name}>
            <h3 className="font-bold text-base mb-3 underline">{section.name}</h3>
            <div className="space-y-4">
              {section.items.map((pq, i) => (
                <div key={pq.id} className="border-b border-gray-200 pb-3" dir={pq.question?.language === 'urdu' ? 'rtl' : 'ltr'}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium"><span className="font-bold">Q{i + 1}.</span> {pq.question?.question_text}</p>
                    <span className="text-sm font-bold ml-4 flex-shrink-0">[{pq.marks}]</span>
                  </div>
                  {pq.question?.question_type === 'mcq' && pq.question.options && (
                    <div className="ml-6 space-y-1">
                      {pq.question.options.map((opt, j) => (
                        <p key={j} className="text-sm">
                          ({getLetterLabel(j)}) {opt.text}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function generatePaperHTML(paper: Paper, questions: PaperQuestion[], totalMarks: number, template: Template): string {
  const font = template === 'classic' ? 'Georgia, serif' : template === 'modern' ? 'Arial, sans-serif' : 'Georgia, serif';
  const sections = [
    { name: 'Section A — Multiple Choice Questions', type: 'mcq', items: questions.filter((pq) => pq.question?.question_type === 'mcq') },
    { name: 'Section B — Short Questions', type: 'short', items: questions.filter((pq) => pq.question?.question_type === 'short') },
    { name: 'Section C — Long Questions', type: 'long', items: questions.filter((pq) => pq.question?.question_type === 'long') },
  ].filter((s) => s.items.length > 0);

  const sectionsHTML = sections.map((section) => `
    <h3 style="font-weight:bold;margin:20px 0 10px;text-decoration:underline;">${section.name}</h3>
    ${section.items.map((pq, i) => `
      <div style="border-bottom:1px solid #ddd;padding-bottom:10px;margin-bottom:10px;" dir="${pq.question?.language === 'urdu' ? 'rtl' : 'ltr'}">
        <div style="display:flex;justify-content:space-between;">
          <p style="font-weight:500;"><b>Q${i + 1}.</b> ${pq.question?.question_text ?? ''}</p>
          <span style="font-weight:bold;margin-left:16px;">[${pq.marks}]</span>
        </div>
        ${pq.question?.question_type === 'mcq' && pq.question.options
          ? `<div style="margin-left:24px;margin-top:8px;">${pq.question.options.map((opt, j) => `<p style="margin:4px 0;">(${String.fromCharCode(65 + j)}) ${opt.text}</p>`).join('')}</div>`
          : '<div style="margin-top:20px;border-bottom:1px dotted #999;"></div>'.repeat(pq.question?.question_type === 'long' ? 5 : 2)}
      </div>
    `).join('')}
  `).join('');

  return `<!DOCTYPE html><html><head><title>${paper.title}</title>
  <style>
    body { font-family: ${font}; max-width: 800px; margin: 0 auto; padding: 40px; color: #000; }
    h1 { text-align: center; font-size: 24px; margin-bottom: 4px; }
    h2 { text-align: center; font-size: 18px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px; }
    .meta { display: flex; justify-content: space-between; font-size: 14px; margin-top: 8px; }
    .instructions { margin-bottom: 24px; font-size: 14px; }
    @media print { body { padding: 20px; } }
  </style></head><body>
  <div class="header">
    ${paper.institution_name ? `<h1>${paper.institution_name}</h1>` : ''}
    <h2>${paper.exam_name || 'Examination'}</h2>
    <div class="meta"><span>Subject: ${paper.subject || '—'}</span><span>Class: ${paper.class_name || '—'}</span></div>
    <div class="meta"><span>Date: ${paper.exam_date || '—'}</span><span>Time: ${paper.exam_time || '—'}</span><span>Total Marks: ${totalMarks}</span></div>
  </div>
  ${paper.instructions ? `<div class="instructions"><p><b>Instructions:</b> ${paper.instructions}</p></div>` : ''}
  ${sectionsHTML}
  </body></html>`;
}

function generatePaperText(paper: Paper, questions: PaperQuestion[], totalMarks: number): string {
  const sections = [
    { name: 'Section A — MCQs', type: 'mcq', items: questions.filter((pq) => pq.question?.question_type === 'mcq') },
    { name: 'Section B — Short Questions', type: 'short', items: questions.filter((pq) => pq.question?.question_type === 'short') },
    { name: 'Section C — Long Questions', type: 'long', items: questions.filter((pq) => pq.question?.question_type === 'long') },
  ].filter((s) => s.items.length > 0);

  let text = `${paper.institution_name ?? ''}\n${paper.exam_name ?? 'Examination'}\n`;
  text += `Subject: ${paper.subject ?? '—'}  Class: ${paper.class_name ?? '—'}\n`;
  text += `Date: ${paper.exam_date ?? '—'}  Time: ${paper.exam_time ?? '—'}  Total Marks: ${totalMarks}\n`;
  text += `${'='.repeat(60)}\n\n`;
  if (paper.instructions) text += `Instructions: ${paper.instructions}\n\n`;

  sections.forEach((section) => {
    text += `${section.name}\n${'-'.repeat(40)}\n`;
    section.items.forEach((pq, i) => {
      text += `Q${i + 1}. ${pq.question?.question_text ?? ''} [${pq.marks} marks]\n`;
      if (pq.question?.question_type === 'mcq' && pq.question.options) {
        pq.question.options.forEach((opt, j) => {
          text += `   ${String.fromCharCode(65 + j)}) ${opt.text}\n`;
        });
      } else {
        text += '\n';
      }
      text += '\n';
    });
  });

  return text;
}
