import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, FilePlus2, Loader2, NotebookPen, Pin, Save, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/nsa/Button';
import { Card } from '@/components/nsa/Card';
import { EmptyState, Spinner } from '@/components/nsa/Feedback';
import { Modal } from '@/components/nsa/Modal';
import { FileUpload } from '@/components/generator/FileUpload';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { supabase } from '@/lib/supabase';
import { generateNoteFn } from '@/lib/notes.functions';
import type { GenAttachment } from '@/services/aiService';

interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  subject: string | null;
  is_pinned: boolean;
  updated_at: string;
}

export function NotesPage() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSubject, setAiSubject] = useState('');
  const [aiLanguage, setAiLanguage] = useState('english');
  const [aiStyle, setAiStyle] = useState('structured');
  const [aiAttachments, setAiAttachments] = useState<GenAttachment[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!userId) {
      setNotes([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });
    const next = (data as Note[]) ?? [];
    setNotes(next);
    setActive((current) => current ? next.find((note) => note.id === current.id) ?? next[0] ?? null : next[0] ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadNotes(); }, [loadNotes]);
  useRealtimeSync(['notes'], userId, loadNotes);

  const createNote = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notes')
      .insert({ user_id: userId, title: 'Untitled Note', content: '', subject: null })
      .select('*')
      .single();
    if (data) {
      const note = data as Note;
      setNotes((previous) => [note, ...previous]);
      setActive(note);
    }
  };

  const saveNote = async () => {
    if (!active || !userId) return;
    setSaving(true);
    await supabase
      .from('notes')
      .update({ title: active.title.trim() || 'Untitled Note', content: active.content, subject: active.subject || null, is_pinned: active.is_pinned })
      .eq('id', active.id)
      .eq('user_id', userId);
    setSaving(false);
    await loadNotes();
  };

  const deleteNote = async () => {
    if (!active || !userId) return;
    await supabase.from('notes').delete().eq('id', active.id).eq('user_id', userId);
    const remaining = notes.filter((note) => note.id !== active.id);
    setNotes(remaining);
    setActive(remaining[0] ?? null);
  };

  const generateAiNote = async () => {
    if (!userId) return;
    if (!aiPrompt.trim() && aiAttachments.length === 0) {
      setAiError('Write an instruction or upload a file first.');
      return;
    }
    setAiError(null);
    setAiLoading(true);
    try {
      const result = await generateNoteFn({
        data: {
          prompt: aiPrompt,
          language: aiLanguage,
          style: aiStyle,
          subject: aiSubject.trim() || null,
          attachments: aiAttachments.map((a) => ({
            name: a.name,
            mime: a.mime,
            dataUrl: a.dataUrl ?? null,
            text: a.text ?? null,
          })),
        },
      });

      const { data } = await supabase
        .from('notes')
        .insert({
          user_id: userId,
          title: result.title,
          content: result.content,
          subject: aiSubject.trim() || null,
        })
        .select('*')
        .single();

      if (data) {
        const note = data as Note;
        setNotes((previous) => [note, ...previous]);
        setActive(note);
      }
      setAiOpen(false);
      setAiPrompt('');
      setAiAttachments([]);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Could not generate notes. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Notes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Write your own notes or let AI create them for you.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setAiOpen(true)}><Sparkles size={17} /> AI Notes Generator</Button>
          <Button variant="secondary" onClick={createNote}><FilePlus2 size={17} /> New Note</Button>
        </div>
      </div>

      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="AI Notes Generator" size="lg">
        <div className="space-y-4">
          {aiError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/50 text-error-700 dark:text-error-400 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{aiError}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">What notes do you need?</label>
            <textarea
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              className="input-field min-h-[120px] resize-y"
              placeholder="e.g. Class 10 Physics — make short notes on Newton's laws with formulas and examples"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject</label>
              <input value={aiSubject} onChange={(event) => setAiSubject(event.target.value)} className="input-field" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Language</label>
              <select value={aiLanguage} onChange={(event) => setAiLanguage(event.target.value)} className="input-field">
                <option value="english">English</option>
                <option value="urdu">Urdu</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Style</label>
              <select value={aiStyle} onChange={(event) => setAiStyle(event.target.value)} className="input-field">
                <option value="structured">Headings + explanation</option>
                <option value="bullets">Bullet points</option>
                <option value="summary">Short summary</option>
                <option value="exam">Exam preparation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Upload material (optional)</label>
            <FileUpload onAttachmentsChange={setAiAttachments} />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={() => setAiOpen(false)} disabled={aiLoading}>Cancel</Button>
            <Button onClick={generateAiNote} disabled={aiLoading}>
              {aiLoading ? <><Loader2 size={17} className="animate-spin" /> Generating...</> : <><Sparkles size={17} /> Generate Notes</>}
            </Button>
          </div>
        </div>
      </Modal>


      {notes.length === 0 ? (
        <Card><EmptyState icon={<NotebookPen size={32} />} title="No notes yet" description="Create your first note and it will stay saved with your account." action={<Button onClick={createNote}>Create Note</Button>} /></Card>
      ) : (
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-5 min-h-[560px]">
          <Card className="p-2 h-fit max-h-[70vh] overflow-y-auto">
            {notes.map((note) => (
              <button key={note.id} onClick={() => setActive(note)} className={`w-full text-left p-3 rounded-lg transition-colors ${active?.id === note.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>
                <div className="flex items-center gap-2 font-medium text-sm"><span className="truncate flex-1">{note.title}</span>{note.is_pinned && <Pin size={13} />}</div>
                <p className="text-xs text-slate-400 truncate mt-1">{note.subject || note.content || 'Empty note'}</p>
              </button>
            ))}
          </Card>

          {active && (
            <Card className="p-5 flex flex-col gap-4">
              <div className="flex gap-3">
                <input value={active.title} onChange={(event) => setActive({ ...active, title: event.target.value })} className="input-field flex-1 font-semibold" placeholder="Note title" />
                <Button variant="ghost" title={active.is_pinned ? 'Unpin note' : 'Pin note'} onClick={() => setActive({ ...active, is_pinned: !active.is_pinned })}><Pin size={18} /></Button>
                <Button variant="ghost" title="Delete note" className="text-error-500" onClick={deleteNote}><Trash2 size={18} /></Button>
              </div>
              <input value={active.subject ?? ''} onChange={(event) => setActive({ ...active, subject: event.target.value })} className="input-field" placeholder="Subject or topic (optional)" />
              <textarea value={active.content} onChange={(event) => setActive({ ...active, content: event.target.value })} className="input-field min-h-[380px] resize-y leading-relaxed" placeholder="Start writing your note..." />
              <div className="flex justify-end"><Button onClick={saveNote} disabled={saving}><Save size={17} /> {saving ? 'Saving...' : 'Save Note'}</Button></div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}