import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import {
  Database,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Badge } from '@/components/nsa/Badge';
import { CLASS_GROUPS } from '@/lib/curriculum';
import {
  bankAiFillFn,
  bankDeleteImportFn,
  bankDeleteQuestionFn,
  bankImportCsvFn,
  bankOverviewFn,
  bankQuestionsFn,
  bankSampleCsvFn,
} from '@/lib/bank.functions';
import { bankBulkProgressFn, bankBulkStepFn } from '@/lib/bankBulk.functions';

interface BookStat {
  class_level: string;
  book: string;
  mcq: number;
  short: number;
  long: number;
  total: number;
}

/**
 * Staff tool for the offline question bank: see coverage, import CSV files,
 * top a chapter up with AI, and clean up bad rows.
 */
export function AdminBankPanel() {
  const overview = useServerFn(bankOverviewFn);
  const listQuestions = useServerFn(bankQuestionsFn);
  const importCsv = useServerFn(bankImportCsvFn);
  const sampleCsv = useServerFn(bankSampleCsvFn);
  const deleteQuestion = useServerFn(bankDeleteQuestionFn);
  const deleteImport = useServerFn(bankDeleteImportFn);
  const aiFill = useServerFn(bankAiFillFn);

  const [stats, setStats] = useState<{ total: number; books: BookStat[]; imports: any[] } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [classLevel, setClassLevel] = useState('9th');
  const group = useMemo(() => CLASS_GROUPS.find((g) => g.classLevel === classLevel), [classLevel]);
  const [bookName, setBookName] = useState('');
  const book = useMemo(() => group?.books.find((b) => b.name === bookName), [group, bookName]);
  const [chapter, setChapter] = useState('');

  const [csv, setCsv] = useState('');
  const [label, setLabel] = useState('');
  const [preview, setPreview] = useState<any | null>(null);
  const [message, setMessage] = useState('');

  const [counts, setCounts] = useState({ mcq: 10, short: 8, long: 3 });
  const [questions, setQuestions] = useState<any[]>([]);

  // ---- bulk fill (walks the whole syllabus, one small batch at a time) ----
  const bulkStep = useServerFn(bankBulkStepFn);
  const bulkProgress = useServerFn(bankBulkProgressFn);
  const [bulkClass, setBulkClass] = useState('9th');
  const [bulkBook, setBulkBook] = useState('');
  const [targets, setTargets] = useState({ mcq: 60, short: 30, long: 12 });
  const [progress, setProgress] = useState<{
    chapters: number;
    chaptersDone: number;
    questions: number;
    missing: number;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const [log, setLog] = useState<string[]>([]);
  const bulkGroup = useMemo(() => CLASS_GROUPS.find((g) => g.classLevel === bulkClass), [bulkClass]);

  const scope = useMemo(
    () => ({ classLevel: bulkClass, book: bulkBook, targets }),
    [bulkClass, bulkBook, targets],
  );

  const checkProgress = async () => {
    try {
      setProgress(await bulkProgress({ data: scope }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read progress.');
    }
  };

  const startBulk = async () => {
    setError('');
    setLog([]);
    runningRef.current = true;
    setRunning(true);
    while (runningRef.current) {
      try {
        const res = await bulkStep({ data: scope });
        setProgress(res.progress);
        if (res.done) {
          setLog((l) => ['All chapters in this scope have reached their targets.', ...l].slice(0, 60));
          break;
        }
        const c = res.current!;
        setLog((l) =>
          [`${c.classLevel} • ${c.book} • ${c.chapter} → +${res.created} saved`, ...l].slice(0, 60),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Generation stopped.';
        setError(msg);
        setLog((l) => [`Stopped: ${msg}`, ...l].slice(0, 60));
        break;
      }
    }
    runningRef.current = false;
    setRunning(false);
    await reload();
  };

  const stopBulk = () => {
    runningRef.current = false;
    setRunning(false);
  };

  const reload = useCallback(async () => {
    try {
      setStats(await overview({ data: {} as never }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the question bank.');
    }
  }, [overview]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    setBookName(group?.books[0]?.name ?? '');
  }, [group]);

  useEffect(() => {
    setChapter(book?.chapters[0] ?? '');
  }, [book]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    setBusy(false);
  };

  const doImport = (dryRun: boolean) =>
    run(async () => {
      const res = await importCsv({
        data: { label: label.trim(), classLevel, book: bookName, csv, dryRun },
      });
      setPreview(res);
      if (!dryRun) {
        setMessage(
          `Added ${res.inserted} questions (${res.duplicates} duplicates skipped, ${res.totalRows - res.validRows} rows rejected).`,
        );
        setCsv('');
        await reload();
      }
    });

  const doAiFill = () =>
    run(async () => {
      const res = await aiFill({
        data: {
          classLevel,
          book: bookName,
          chapter,
          counts,
          language: book?.urdu ? 'urdu' : 'english',
          mcqOptionsCount: 4,
        },
      });
      setMessage(`AI added ${res.created} of ${res.attempted} questions to “${chapter}”.`);
      await reload();
    });

  const loadQuestions = () =>
    run(async () => {
      const res = await listQuestions({ data: { classLevel, book: bookName, chapter, search: '', limit: 60 } });
      setQuestions(res.questions);
    });

  const downloadSample = () =>
    run(async () => {
      const { csv: text } = await sampleCsv({ data: {} as never });
      const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nsagpt-question-bank-sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    });

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-primary-500" />
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Question Bank</h3>
          <Badge variant="primary">{stats?.total?.toLocaleString() ?? '—'} questions</Badge>
          <button onClick={() => void reload()} className="btn-secondary ml-auto text-xs">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Papers for Silver and Gold plans are built only from these questions — no AI credits used.
        </p>

        {error && <p className="mt-3 text-sm text-error-600 dark:text-error-400">{error}</p>}
        {message && <p className="mt-3 text-sm text-success-600 dark:text-success-400">{message}</p>}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="py-2">Class</th>
                <th className="py-2">Book</th>
                <th className="py-2">MCQ</th>
                <th className="py-2">Short</th>
                <th className="py-2">Long</th>
                <th className="py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.books ?? []).map((row) => (
                <tr key={`${row.class_level}-${row.book}`} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2">{row.class_level}</td>
                  <td className="py-2">{row.book}</td>
                  <td className="py-2">{row.mcq}</td>
                  <td className="py-2">{row.short}</td>
                  <td className="py-2">{row.long}</td>
                  <td className="py-2 font-semibold">{row.total}</td>
                </tr>
              ))}
              {!stats?.books.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    The bank is empty — import a CSV or use AI fill below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h4 className="font-display font-semibold text-slate-900 dark:text-white">Choose class, book and chapter</h4>
        <div className="grid sm:grid-cols-3 gap-3">
          <select className="input-field text-sm" value={classLevel} onChange={(e) => setClassLevel(e.target.value)}>
            {CLASS_GROUPS.map((g) => (
              <option key={g.key} value={g.classLevel}>
                {g.label}
              </option>
            ))}
          </select>
          <select className="input-field text-sm" value={bookName} onChange={(e) => setBookName(e.target.value)}>
            {(group?.books ?? []).map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          <select className="input-field text-sm" value={chapter} onChange={(e) => setChapter(e.target.value)}>
            {(book?.chapters ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Upload size={17} className="text-primary-500" />
          <h4 className="font-display font-semibold text-slate-900 dark:text-white">Import questions from CSV</h4>
          <button onClick={downloadSample} className="btn-secondary ml-auto text-xs">
            <Download size={13} /> Sample file
          </button>
        </div>
        <input
          className="input-field text-sm"
          placeholder="Import name (e.g. 9th Physics — past papers)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-sm text-slate-500"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) setCsv(await file.text());
          }}
        />
        <textarea
          className="input-field text-xs font-mono resize-y"
          rows={6}
          placeholder="…or paste CSV rows here"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button disabled={busy || !csv.trim()} onClick={() => void doImport(true)} className="btn-secondary text-sm disabled:opacity-60">
            Check file
          </button>
          <button disabled={busy || !csv.trim()} onClick={() => void doImport(false)} className="btn-primary text-sm disabled:opacity-60">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import
          </button>
        </div>
        {preview && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p>
              {preview.validRows} usable rows of {preview.totalRows}.
            </p>
            {(preview.skipped ?? []).slice(0, 6).map((s: string, i: number) => (
              <p key={i} className="text-error-600 dark:text-error-400">
                {s}
              </p>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={17} className="text-accent-500" />
          <h4 className="font-display font-semibold text-slate-900 dark:text-white">Fill this chapter with AI</h4>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Uses AI once and saves the questions permanently, so teachers never spend AI on the same chapter again.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(['mcq', 'short', 'long'] as const).map((key) => (
            <label key={key} className="text-xs text-slate-500 dark:text-slate-400">
              {key === 'mcq' ? 'MCQs' : key === 'short' ? 'Short' : 'Long'}
              <input
                type="number"
                min={0}
                max={key === 'long' ? 15 : 30}
                className="input-field text-sm mt-1"
                value={counts[key]}
                onChange={(e) => setCounts({ ...counts, [key]: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
          ))}
        </div>
        <button disabled={busy || !chapter} onClick={() => void doAiFill()} className="btn-primary text-sm disabled:opacity-60">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Generate and save
        </button>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-display font-semibold text-slate-900 dark:text-white">Review questions</h4>
          <button onClick={() => void loadQuestions()} className="btn-secondary ml-auto text-xs">
            Load chapter
          </button>
        </div>
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-800 dark:text-slate-200">{q.question_text}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {q.question_type} • {q.difficulty} • {q.marks} marks • {q.chapter}
                </p>
              </div>
              <button
                onClick={() =>
                  void run(async () => {
                    await deleteQuestion({ data: { id: q.id } });
                    setQuestions((rows) => rows.filter((r) => r.id !== q.id));
                    await reload();
                  })
                }
                className="ml-auto text-error-500 hover:text-error-600"
                aria-label="Delete question"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!questions.length && <p className="text-sm text-slate-400">Pick a chapter above and press “Load chapter”.</p>}
        </div>
      </Card>

      <Card className="p-5">
        <h4 className="font-display font-semibold text-slate-900 dark:text-white mb-3">Recent imports</h4>
        <div className="space-y-2">
          {(stats?.imports ?? []).map((imp) => (
            <div key={imp.id} className="flex items-center gap-3 text-sm">
              <span className="truncate text-slate-700 dark:text-slate-300">
                {imp.label || 'Untitled'} — {imp.class_level} {imp.book}
              </span>
              <span className="text-xs text-slate-400">
                +{imp.inserted_rows} / {imp.total_rows}
              </span>
              <button
                onClick={() =>
                  void run(async () => {
                    await deleteImport({ data: { id: imp.id } });
                    await reload();
                  })
                }
                className="ml-auto text-error-500 hover:text-error-600"
                aria-label="Undo import"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!stats?.imports.length && <p className="text-sm text-slate-400">No imports yet.</p>}
        </div>
      </Card>
    </div>
  );
}
