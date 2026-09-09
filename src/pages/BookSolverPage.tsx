import { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  Loader2,
  Printer,
  Sparkles,
  CheckCircle2,
  ListOrdered,
} from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Button } from '@/components/nsa/Button';
import { Badge } from '@/components/nsa/Badge';
import { SegmentedControl } from '@/components/nsa/Toggle';
import { FileUpload } from '@/components/generator/FileUpload';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { solveProblemsFn } from '@/lib/solve.functions';
import { CLASS_GROUPS, findBook, findGroup } from '@/lib/curriculum';
import type { GenAttachment } from '@/services/aiService';
import type { SolvedProblem } from '@/types/solve';
import type { Language } from '@/types';

export function BookSolverPage() {
  const { session } = useAuth();

  const [groupKey, setGroupKey] = useState(CLASS_GROUPS[0]?.key ?? '');
  const group = findGroup(groupKey);
  const [bookId, setBookId] = useState(group?.books[0]?.id ?? '');
  const book = findBook(groupKey, bookId) ?? group?.books[0];

  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [detail, setDetail] = useState<'detailed' | 'concise'>('detailed');
  const [limit, setLimit] = useState(10);
  const [wantDiagrams, setWantDiagrams] = useState(true);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<GenAttachment[]>([]);

  const [solving, setSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [solutions, setSolutions] = useState<SolvedProblem[]>([]);

  const language: Language = book?.urdu ? 'urdu' : 'english';
  const isUrdu = language === 'urdu';

  const totalMarks = useMemo(
    () => solutions.reduce((sum, s) => sum + (s.marks || 0), 0),
    [solutions],
  );

  const changeGroup = (key: string) => {
    setGroupKey(key);
    const g = findGroup(key);
    setBookId(g?.books[0]?.id ?? '');
    setSelectedChapters([]);
    setSolutions([]);
  };

  const toggleChapter = (chapter: string) =>
    setSelectedChapters((prev) =>
      prev.includes(chapter) ? prev.filter((c) => c !== chapter) : [...prev, chapter],
    );

  const handleSolve = async () => {
    if (!book) return;
    if (!content.trim() && !attachments.length && !selectedChapters.length) {
      setError('Select at least one chapter, or upload / paste the questions you want solved.');
      return;
    }
    setError(null);
    setNotice(null);
    setSolving(true);
    setSolutions([]);

    try {
      const { problems } = await solveProblemsFn({
        data: {
          text: content,
          attachments: attachments.map((a) => ({
            name: a.name,
            mime: a.mime,
            dataUrl: a.dataUrl ?? null,
            text: a.text ?? null,
          })),
          settings: {
            subjectArea: 'book',
            language,
            detail,
            topic: selectedChapters[0] ?? null,
            problemCount: limit > 0 ? limit : null,
            subjectName: book.name,
            classGroup: group?.label ?? null,
            chapters: selectedChapters.length ? selectedChapters : book.chapters,
            wantDiagrams,
          },
        },
      });

      setSolutions(problems);
      if (!problems.length) setError('No questions could be read from that material. Try another file.');

      if (session && problems.length) {
        try {
          const { data: gen } = await supabase
            .from('generations')
            .insert({
              user_id: session.user.id,
              title: `${book.name} solutions — ${group?.label ?? ''}`.trim(),
              source_text: content || null,
              source_file_name: attachments[0]?.name ?? null,
              source_file_type: attachments[0]?.mime ?? null,
              language,
              question_type: 'long',
              question_count: problems.length,
              difficulty: 'mixed',
              mcq_options_count: null,
              status: 'completed',
              subject: book.name,
              chapter: selectedChapters.join(', ') || null,
            })
            .select()
            .single();

          const rows = problems.map((p, i) => ({
            user_id: session.user.id,
            generation_id: gen?.id ?? null,
            question_text: p.problem_text,
            question_type: 'long' as const,
            options: null,
            correct_answer: null,
            expected_answer: p.final_answer,
            answer_points: [
              ...(p.given.length ? [`Key points: ${p.given.join(', ')}`] : []),
              ...(p.formula ? [`Formula: ${p.formula}`] : []),
              ...p.steps,
            ],
            diagram_svg: p.diagram_svg ?? null,
            diagram_note: p.diagram_note ?? null,
            explanation: p.concept,
            difficulty: p.difficulty,
            topic: p.topic ?? selectedChapters[0] ?? null,
            chapter: p.topic ?? selectedChapters[0] ?? null,
            marks: p.marks,
            language,
            sort_order: i,
            is_saved: true,
          }));
          const { error: saveError } = await supabase.from('questions').insert(rows);
          if (saveError) throw saveError;
          setNotice(`${problems.length} solved questions saved to your Question Bank and History.`);
        } catch {
          setNotice('Solutions are ready, but they could not be saved to your library right now.');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Solving failed. Please try again.');
    } finally {
      setSolving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpenCheck className="text-primary-500" size={26} /> Book Solver
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Solve exercise questions of any book — English, Urdu, Islamiat, Maths, Science and more, with diagrams where needed.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              Class / Group
            </label>
            <select
              value={groupKey}
              onChange={(e) => changeGroup(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
            >
              {CLASS_GROUPS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              Book / Subject
            </label>
            <select
              value={book?.id ?? ''}
              onChange={(e) => {
                setBookId(e.target.value);
                setSelectedChapters([]);
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
            >
              {(group?.books ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Chapters</p>
            <div className="max-h-56 overflow-y-auto scrollbar-thin space-y-1 pr-1">
              {(book?.chapters ?? []).map((ch) => (
                <label
                  key={ch}
                  className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedChapters.includes(ch)}
                    onChange={() => toggleChapter(ch)}
                    className="mt-0.5 accent-primary-500"
                  />
                  <span>{ch}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Answer detail</p>
            <SegmentedControl
              value={detail}
              onChange={(v) => setDetail(v as 'detailed' | 'concise')}
              options={[
                { value: 'detailed', label: 'Detailed' },
                { value: 'concise', label: 'Short' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              How many questions
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={wantDiagrams}
              onChange={(e) => setWantDiagrams(e.target.checked)}
              className="accent-primary-500"
            />
            Add diagrams where helpful
          </label>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Upload the exercise (optional)
            </p>
            <FileUpload onAttachmentsChange={setAttachments} />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Or paste the questions here…"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
            />

            {error && (
              <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            )}
            {notice && (
              <p className="text-sm text-success-600 dark:text-success-400 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> {notice}
              </p>
            )}

            <Button onClick={handleSolve} disabled={solving} className="w-full sm:w-auto">
              {solving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Solving…
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Solve Questions
                </>
              )}
            </Button>
          </Card>

          {solutions.length > 0 && (
            <Card className="p-5 space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge>{solutions.length} solved</Badge>
                  <Badge>{totalMarks} marks</Badge>
                </div>
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer size={16} /> Print / Save PDF
                </Button>
              </div>

              {solutions.map((s, i) => (
                <div
                  key={i}
                  dir={isUrdu ? 'rtl' : 'ltr'}
                  className={`rounded-2xl border border-slate-200 dark:border-slate-700 p-4 ${
                    isUrdu ? 'text-right leading-loose' : ''
                  }`}
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {i + 1}. {s.problem_text}
                  </p>

                  {s.diagram_svg && (
                    <figure className="my-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-3 inline-block max-w-full">
                      <div
                        className="[&>svg]:max-w-full [&>svg]:h-auto"
                        dangerouslySetInnerHTML={{ __html: s.diagram_svg }}
                      />
                      {s.diagram_note && (
                        <figcaption className="mt-1 text-xs text-slate-500">{s.diagram_note}</figcaption>
                      )}
                    </figure>
                  )}

                  {s.given.length > 0 && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {s.given.join(' · ')}
                    </p>
                  )}
                  {s.formula && (
                    <p className="mt-1 text-sm font-mono text-primary-600 dark:text-primary-400">
                      {s.formula}
                    </p>
                  )}

                  <ol className="mt-3 space-y-1.5">
                    {s.steps.map((step, k) => (
                      <li key={k} className="text-sm text-slate-700 dark:text-slate-200 flex gap-2">
                        <ListOrdered size={14} className="mt-1 shrink-0 text-slate-400" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>

                  <p className="mt-3 text-sm font-semibold text-success-700 dark:text-success-400">
                    {s.final_answer}
                    {s.units ? ` ${s.units}` : ''}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
