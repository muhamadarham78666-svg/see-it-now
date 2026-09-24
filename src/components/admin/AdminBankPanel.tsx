import { useCallback, useEffect, useMemo, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import {
  Database,
  Download,
  Loader2,
  Pause,
  Play,
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
import {
  bankBulkJobFn,
  bankBulkPauseFn,
  bankBulkProgressFn,
  bankBulkRunFn,
  bankBulkStartFn,
} from '@/lib/bankBulk.functions';

interface BulkJob {
  id: string;
  status: 'running' | 'waiting' | 'paused' | 'completed' | 'blocked';
  scope: { classLevel: string; book: string; targets: { mcq: number; short: number; long: number } };
  progress: { chapters: number; chaptersDone: number; questions: number; missing: number };
  nextRetryAt: string | null;
  lastMessage: string;
  lastChapter: string;
  updatedAt: string;
}

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
  const bulkProgress = useServerFn(bankBulkProgressFn);
  const getBulkJob = useServerFn(bankBulkJobFn);
  const startBulkJob = useServerFn(bankBulkStartFn);
  const pauseBulkJob = useServerFn(bankBulkPauseFn);
  const runBulkJob = useServerFn(bankBulkRunFn);
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
  const [job, setJob] = useState<BulkJob | null>(null);
  const [now, setNow] = useState(() => Date.now());
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
    setRunning(true);
    try {
      const started = await startBulkJob({ data: scope });
      setJob(started);
      setProgress(started.progress);
      const stepped = await runBulkJob({ data: { id: started.id } });
      if (stepped) {
        setJob(stepped);
        setProgress(stepped.progress);
        setLog((lines) => [stepped.lastMessage, ...lines].slice(0, 20));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start filling.');
    }
    setRunning(false);
    await reload();
  };

  const stopBulk = async () => {
    if (!job) return;
    setRunning(true);
    try {
      const paused = await pauseBulkJob({ data: { id: job.id } });
      setJob(paused);
      setProgress(paused.progress);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not pause filling.');
    }
    setRunning(false);
  };

  const runNow = async () => {
    if (!job) return;
    setRunning(true);
    setError('');
    try {
      const next = await runBulkJob({ data: { id: job.id } });
      if (next) {
        setJob(next);
        setProgress(next.progress);
        setLog((lines) => [next.lastMessage, ...lines].slice(0, 20));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not run this step.');
    }
    setRunning(false);
    await reload();
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
    void getBulkJob().then((saved) => {
      setJob(saved);
      if (saved) {
        setProgress(saved.progress);
        setBulkClass(saved.scope.classLevel);
        setBulkBook(saved.scope.book);
        setTargets(saved.scope.targets);
      }
    }).catch(() => undefined);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [getBulkJob]);

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

  const retryMs = job?.nextRetryAt ? Math.max(0, new Date(job.nextRetryAt).getTime() - now) : 0;
  const retryHours = Math.floor(retryMs / 3_600_000);
  const retryMinutes = Math.floor((retryMs % 3_600_000) / 60_000);
  const retrySeconds = Math.floor((retryMs % 60_000) / 1000);
  const statusLabel = job?.status === 'running'
    ? 'Ready'
    : job?.status === 'waiting'
      ? 'Free AI resting'
      : job?.status === 'completed'
        ? 'Completed'
        : job?.status === 'blocked'
          ? 'Needs attention'
          : 'Paused';
  const statusVariant = job?.status === 'completed'
    ? 'success'
    : job?.status === 'waiting'
      ? 'warning'
      : job?.status === 'blocked'
        ? 'error'
        : 'primary';

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
          <Sparkles size={17} className="text-primary-500" />
          <h4 className="font-display font-semibold text-slate-900 dark:text-white">Bulk fill the whole syllabus</h4>
          {job && <Badge variant={statusVariant}>{statusLabel}</Badge>}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Fills every chapter of the chosen scope up to the targets below, one chapter at a time. It only
          uses the books and chapters saved in NSAGPT, skips duplicates, and remembers where it stopped —
          you can close this and continue later.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <select className="input-field text-sm" value={bulkClass} onChange={(e) => { setBulkClass(e.target.value); setBulkBook(''); }}>
            <option value="">All classes (9th – 12th)</option>
            {CLASS_GROUPS.map((g) => (
              <option key={g.key} value={g.classLevel}>
                {g.label}
              </option>
            ))}
          </select>
          <select className="input-field text-sm" value={bulkBook} onChange={(e) => setBulkBook(e.target.value)} disabled={!bulkClass}>
            <option value="">All books of this class</option>
            {(bulkGroup?.books ?? []).map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['mcq', 'short', 'long'] as const).map((key) => (
            <label key={key} className="text-xs text-slate-500 dark:text-slate-400">
              {key === 'mcq' ? 'MCQs per chapter' : key === 'short' ? 'Short per chapter' : 'Long per chapter'}
              <input
                type="number"
                min={0}
                max={key === 'long' ? 120 : 300}
                className="input-field text-sm mt-1"
                value={targets[key]}
                onChange={(e) => setTargets({ ...targets, [key]: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {job && ['running', 'waiting'].includes(job.status) ? (
            <button disabled={running} onClick={() => void stopBulk()} className="btn-secondary text-sm disabled:opacity-60">
              {running ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />} Pause safely
            </button>
          ) : (
            <button disabled={running} onClick={() => void startBulk()} className="btn-primary text-sm disabled:opacity-60">
              {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} {job ? 'Resume bulk fill' : 'Start bulk fill'}
            </button>
          )}
          {job && job.status !== 'completed' && (
            <button disabled={running || job.status === 'blocked'} onClick={() => void runNow()} className="btn-secondary text-sm disabled:opacity-60">
              <Sparkles size={14} /> Run one step now
            </button>
          )}
          <button onClick={() => void checkProgress()} className="btn-secondary text-sm">
            <RefreshCw size={13} /> Check progress
          </button>
        </div>

        {progress && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300">
            <p>
              Chapters completed: <b>{progress.chaptersDone}</b> of {progress.chapters} • saved questions:{' '}
              <b>{progress.questions.toLocaleString()}</b> • still needed: {progress.missing.toLocaleString()}
            </p>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-2 rounded-full bg-primary-500 transition-all"
                style={{
                  width: `${progress.chapters ? Math.round((progress.chaptersDone / progress.chapters) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {job && (
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-950/30">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300">
                {job.status === 'waiting' ? <RefreshCw size={17} className="animate-spin" /> : <Sparkles size={17} />}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-white">{job.lastMessage}</p>
                {job.status === 'waiting' && job.nextRetryAt && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Next automatic attempt in {retryHours > 0 ? `${retryHours}h ` : ''}{retryMinutes}m {retrySeconds}s
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Paid credits stay protected. Your saved questions and progress are safe.
                </p>
                {job.lastChapter && <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">Last: {job.lastChapter}</p>}
              </div>
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
            {log.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
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
