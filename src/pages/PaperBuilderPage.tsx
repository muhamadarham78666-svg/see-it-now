import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '@/lib/rr';
import {
  Newspaper,
  Plus,
  Trash2,
  Printer,
  Eye,
  Save,
  Download,
  Copy,
  Pencil,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Button } from '@/components/nsa/Button';
import { Badge } from '@/components/nsa/Badge';
import { Spinner, EmptyState } from '@/components/nsa/Feedback';
import { Modal } from '@/components/nsa/Modal';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { PaperPreviewModal } from '@/components/questions/PaperPreviewModal';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { buildPaperHtml, buildPaperText, downloadFile, PDF_STYLE_OPTIONS, printHtml, type PaperMeta, type PdfStyleKey } from '@/lib/paperExport';
import type { Paper, Question, PaperQuestion } from '@/types';

interface PaperSection {
  id: string;
  name: string;
  questionType: 'mcq' | 'short' | 'long';
  questionIds: string[];
}

export function PaperBuilderPage() {
  const { session } = useAuth();
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Paper | null>(null);
  const [busy, setBusy] = useState(false);

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

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;
    loadPapers();
    loadAvailableQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useRealtimeSync(['questions'], userId, () => {
    loadAvailableQuestions();
  });

  useRealtimeSync(['papers'], userId, () => {
    loadPapers();
  });

  useEffect(() => {
    if (incomingQuestionIds.length > 0 && papers.length > 0 && activePaper) {
      addQuestionsToPaper(activePaper.id, incomingQuestionIds);
    }
  }, [incomingQuestionIds, papers, activePaper]);

  const loadPapers = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('papers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
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
    if (!userId) return;
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_saved', true)
      .order('created_at', { ascending: false });
    setAvailableQuestions((data as Question[]) ?? []);
  };

  const resetForm = () => {
    setForm({
      title: '', institution_name: '', subject: '', class_name: '', chapter: '',
      exam_name: '', exam_date: '', exam_time: '', total_marks: 100,
      instructions: 'Attempt all questions. Write neatly and clearly.',
    });
  };

  const openNewPaper = () => {
    setEditingId(null);
    resetForm();
    setShowNewModal(true);
  };

  const openEditPaper = (p: Paper) => {
    setEditingId(p.id);
    setForm({
      title: p.title ?? '',
      institution_name: p.institution_name ?? '',
      subject: p.subject ?? '',
      class_name: p.class_name ?? '',
      chapter: p.chapter ?? '',
      exam_name: p.exam_name ?? '',
      exam_date: p.exam_date ?? '',
      exam_time: p.exam_time ?? '',
      total_marks: p.total_marks ?? 100,
      instructions: p.instructions ?? '',
    });
    setShowNewModal(true);
  };

  const handleSavePaper = async () => {
    if (!userId || !form.title) return;
    setBusy(true);
    try {
      const payload = { ...form, exam_date: form.exam_date || null };

      if (editingId) {
        const { data, error } = await supabase
          .from('papers')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
        if (!error && data) {
          const updated = data as Paper;
          setPapers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setActivePaper((prev) => (prev?.id === updated.id ? updated : prev));
          setShowNewModal(false);
          setEditingId(null);
        }
        return;
      }

      const { data, error } = await supabase
        .from('papers')
        .insert({ user_id: userId, ...payload, status: 'draft', pdf_style: 'academic' })
        .select()
        .single();

      if (!error && data) {
        const newPaper = data as Paper;
        setPapers((prev) => [newPaper, ...prev]);
        setActivePaper(newPaper);
        setPaperQuestions([]);
        setShowNewModal(false);
        resetForm();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicatePaper = async (p: Paper) => {
    if (!userId) return;
    setBusy(true);
    try {
      const { data: created, error } = await supabase
        .from('papers')
        .insert({
          user_id: userId,
          title: `${p.title} (Copy)`,
          institution_name: p.institution_name,
          subject: p.subject,
          class_name: p.class_name,
          chapter: p.chapter,
          exam_name: p.exam_name,
          exam_date: p.exam_date,
          exam_time: p.exam_time,
          total_marks: p.total_marks,
          instructions: p.instructions,
          logo_url: p.logo_url,
          footer_note: p.footer_note,
          watermark_text: p.watermark_text,
          pdf_style: p.pdf_style,
          print_settings: p.print_settings,
          attempts: p.attempts,
          status: 'draft',
        })
        .select()
        .single();
      if (error || !created) return;

      const copy = created as Paper;
      const { data: rows } = await supabase
        .from('paper_questions')
        .select('question_id, sort_order, marks')
        .eq('paper_id', p.id)
        .order('sort_order', { ascending: true });

      if (rows && rows.length > 0) {
        await supabase.from('paper_questions').insert(
          rows.map((r) => ({
            paper_id: copy.id,
            question_id: r.question_id,
            user_id: userId,
            sort_order: r.sort_order,
            marks: r.marks,
          })),
        );
      }

      setPapers((prev) => [copy, ...prev]);
      setActivePaper(copy);
      loadPaperQuestions(copy.id);
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePaper = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const id = deleteTarget.id;
      await supabase.from('paper_questions').delete().eq('paper_id', id);
      await supabase.from('papers').delete().eq('id', id);
      const remaining = papers.filter((p) => p.id !== id);
      setPapers(remaining);
      setDeleteTarget(null);
      if (activePaper?.id === id) {
        const next = remaining[0] ?? null;
        setActivePaper(next);
        if (next) loadPaperQuestions(next.id);
        else setPaperQuestions([]);
      }
    } finally {
      setBusy(false);
    }
  };

  const addQuestionsToPaper = async (paperId: string, questionIds: string[]) => {
    const existing = paperQuestions.map((pq) => pq.question_id);
    const toAdd = questionIds.filter((id) => !existing.includes(id));
    if (toAdd.length === 0 || !userId) return;

    const startOrder = paperQuestions.length;
    const rows = toAdd.map((qid, i) => ({
      paper_id: paperId,
      question_id: qid,
      user_id: userId,
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
    if (activePaper) loadPaperQuestions(activePaper.id);
  };

  const handleUpdateMarks = async (pqId: string, marks: number) => {
    await supabase.from('paper_questions').update({ marks }).eq('id', pqId);
    setPaperQuestions((prev) => prev.map((pq) => (pq.id === pqId ? { ...pq, marks } : pq)));
  };

  const totalMarks = paperQuestions.reduce((sum, pq) => sum + pq.marks, 0);
  const printableQuestions = useMemo(
    () => paperQuestions.flatMap((pq) => pq.question ? [{ ...pq.question, marks: pq.marks }] : []),
    [paperQuestions],
  );

  const paperMeta = useMemo<PaperMeta | null>(() => activePaper ? ({
    title: activePaper.title,
    institutionName: activePaper.institution_name ?? undefined,
    subject: activePaper.subject ?? undefined,
    className: activePaper.class_name ?? undefined,
    examName: activePaper.exam_name ?? undefined,
    examDate: activePaper.exam_date ?? undefined,
    examTime: activePaper.exam_time ?? undefined,
    instructions: activePaper.instructions ?? undefined,
    logoUrl: activePaper.logo_url ?? undefined,
    footerNote: activePaper.footer_note ?? undefined,
    watermarkText: activePaper.watermark_text ?? undefined,
    pdfStyle: PDF_STYLE_OPTIONS.some((option) => option.value === activePaper.pdf_style)
      ? activePaper.pdf_style as PdfStyleKey
      : 'academic',
    printSettings: activePaper.print_settings,
    attempts: activePaper.attempts,
  }) : null, [activePaper]);

  const getSections = (): PaperSection[] => {
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
    if (!paperMeta) return;
    printHtml(buildPaperHtml(paperMeta, printableQuestions, { withAnswers: false }));
  };

  const handleExportTXT = () => {
    if (!activePaper || !paperMeta) return;
    downloadFile(`${activePaper.title.replace(/\s+/g, '_')}.txt`, buildPaperText(paperMeta, printableQuestions, false), 'text/plain;charset=utf-8');
  };

  const handleCopyPaper = async () => {
    if (!paperMeta) return;
    const text = buildPaperText(paperMeta, printableQuestions, false);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard may be blocked
    }
  };

  const savePrintMeta = useCallback(async (meta: PaperMeta) => {
    if (!activePaper) return;
    const payload = {
      institution_name: meta.institutionName ?? null,
      subject: meta.subject ?? null,
      class_name: meta.className ?? null,
      exam_name: meta.examName ?? null,
      exam_date: meta.examDate || null,
      exam_time: meta.examTime ?? null,
      instructions: meta.instructions ?? null,
      logo_url: meta.logoUrl ?? null,
      footer_note: meta.footerNote ?? null,
      watermark_text: meta.watermarkText ?? null,
      pdf_style: meta.pdfStyle ?? 'academic',
      print_settings: meta.printSettings ?? {},
      attempts: meta.attempts ?? {},
    };
    const { data } = await supabase.from('papers').update(payload).eq('id', activePaper.id).select().single();
    if (data) {
      const updated = data as Paper;
      setActivePaper(updated);
      setPapers((current) => current.map((paper) => paper.id === updated.id ? updated : paper));
    }
  }, [activePaper?.id]);

  const selectTemplate = async (pdfStyle: PdfStyleKey) => {
    if (!activePaper) return;
    const { data } = await supabase.from('papers').update({ pdf_style: pdfStyle, print_settings: {} }).eq('id', activePaper.id).select().single();
    if (data) {
      const updated = data as Paper;
      setActivePaper(updated);
      setPapers((current) => current.map((paper) => paper.id === updated.id ? updated : paper));
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
          <Button onClick={openNewPaper}>
            <Plus size={18} /> New Paper
          </Button>
        </div>
      </div>

      {/* My Papers */}
      {papers.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-2">
            My Papers ({papers.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {papers.map((p) => {
              const active = activePaper?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`card p-3 transition-all ${
                    active ? 'ring-2 ring-primary-500/60 border-primary-300' : 'hover:border-primary-300'
                  }`}
                >
                  <button
                    onClick={() => { setActivePaper(p); loadPaperQuestions(p.id); }}
                    className="w-full text-left"
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {[p.subject, p.class_name, p.exam_name].filter(Boolean).join(' • ') || 'No details yet'}
                    </p>
                  </button>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-1">
                    <IconAction label="Edit details" onClick={() => openEditPaper(p)}>
                      <Pencil size={14} />
                    </IconAction>
                    <IconAction label="Duplicate" onClick={() => handleDuplicatePaper(p)}>
                      <Copy size={14} />
                    </IconAction>
                    <IconAction
                      label="Download"
                      onClick={() => { setActivePaper(p); loadPaperQuestions(p.id); setShowPreview(true); }}
                    >
                      <Download size={14} />
                    </IconAction>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      title="Delete"
                      aria-label="Delete paper"
                      className="ml-auto p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Template selector */}
      {activePaper && (
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Template:</span>
            {PDF_STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => selectTemplate(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  (activePaper.pdf_style || 'academic') === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {!activePaper ? (
        <Card>
          <EmptyState
            icon={<Newspaper size={32} />}
            title="No question papers yet"
            description="Create a new paper to start building your professional exam paper."
            action={<Button onClick={openNewPaper}><Plus size={16} /> Create Paper</Button>}
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
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title={editingId ? 'Edit Paper Details' : 'Create New Paper'} size="lg">
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
          <Button onClick={handleSavePaper} disabled={!form.title || busy}>
            <Save size={18} /> {editingId ? 'Save Changes' : 'Create Paper'}
          </Button>
        </div>
      </Modal>

      {paperMeta && (
        <PaperPreviewModal
          key={activePaper?.id}
          open={showPreview}
          onClose={() => setShowPreview(false)}
          questions={printableQuestions}
          defaultMeta={paperMeta}
          onMetaChange={savePrintMeta}
        />
      )}

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete this paper?" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          “{deleteTarget?.title}” and its question list will be permanently removed. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeletePaper} disabled={busy}>
            <Trash2 size={16} /> Delete Paper
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700"
    >
      {children}
    </button>
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

