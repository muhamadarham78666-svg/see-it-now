import { useCallback, useEffect, useState } from 'react';
import { FilePlus2, NotebookPen, Pin, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/nsa/Button';
import { Card } from '@/components/nsa/Card';
import { EmptyState, Spinner } from '@/components/nsa/Feedback';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { supabase } from '@/lib/supabase';

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

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Notes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Write and save private notes in your account.</p>
        </div>
        <Button onClick={createNote}><FilePlus2 size={17} /> New Note</Button>
      </div>

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