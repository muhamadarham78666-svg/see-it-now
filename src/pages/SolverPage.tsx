import { useMemo, useState } from 'react';
import { useNavigate } from '@/lib/rr';
import {
  Calculator,
  Atom,
  Sigma,
  Languages,
  Loader2,
  ListOrdered,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Sparkles,
  Archive,
} from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Button } from '@/components/nsa/Button';
import { Badge } from '@/components/nsa/Badge';
import { SegmentedControl } from '@/components/nsa/Toggle';
import { FileUpload } from '@/components/generator/FileUpload';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { solveProblemsFn } from '@/lib/solve.functions';
import type { GenAttachment } from '@/services/aiService';
import type { SolvedProblem } from '@/types/solve';
import type { Language } from '@/types';

type SubjectArea = 'physics' | 'math';

export function SolverPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [subjectArea, setSubjectArea] = useState<SubjectArea>('physics');
  const [language, setLanguage] = useState<Language>('english');
  const [detail, setDetail] = useState<'detailed' | 'concise'>('detailed');
  const [topic, setTopic] = useState('');
  const [limit, setLimit] = useState<number>(10);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<GenAttachment[]>([]);

  const [solving, setSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [solutions, setSolutions] = useState<SolvedProblem[]>([]);

  const hasMaterial = content.trim().length > 0 || attachments.length > 0 || topic.trim().length > 0;
  const isUrdu = language === 'urdu';

  const subjectLabel = subjectArea === 'physics' ? 'Physics' : 'Mathematics';

  const totalMarks = useMemo(
    () => solutions.reduce((sum, s) => sum + (s.marks || 0), 0),
    [solutions],
  );

  const handleSolve = async () => {
    if (!hasMaterial) {
      setError('Upload a file, paste the problems, or at least enter a topic first.');
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
            subjectArea,
            language,
            detail,
            topic: topic || null,
            problemCount: limit > 0 ? limit : null,
          },
        },
      });

      setSolutions(problems);

      if (profile && problems.length) {
        try {
          const { data: gen } = await supabase
            .from('generations')
            .insert({
              user_id: profile.id,
              title: topic
                ? `${subjectLabel} solutions — ${topic}`
                : `${subjectLabel} solved problems`,
              source_text: content || null,
              source_file_name: attachments[0]?.name ?? null,
              source_file_type: attachments[0]?.mime ?? null,
              language,
              question_type: 'long',
              question_count: problems.length,
              difficulty: 'mixed',
              mcq_options_count: null,
              status: 'completed',
              subject: subjectLabel,
              chapter: topic || null,
            })
            .select()
            .single();

          const rows = problems.map((p, i) => ({
            user_id: profile.id,
            generation_id: gen?.id ?? null,
            question_text: p.problem_text,
            question_type: 'long' as const,
            options: null,
            correct_answer: null,
            expected_answer: p.final_answer,
            answer_points: [
              ...(p.given.length ? [`Given: ${p.given.join(', ')}`] : []),
              ...(p.formula ? [`Formula: ${p.formula}`] : []),
              ...p.steps,
              `Answer: ${p.final_answer}`,
            ],
            explanation: p.concept,
            difficulty: p.difficulty,
            topic: p.topic ?? topic ?? null,
            marks: p.marks,
            language,
            sort_order: i,
            is_saved: true,
          }));
          const { error: saveError } = await supabase.from('questions').insert(rows);
          if (saveError) throw saveError;
          setNotice(`${problems.length} solved problems saved to your Question Bank and History.`);
        } catch {
          setNotice('Solutions are ready, but they could not be saved to your library right now.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to solve the problems.');
    } finally {
      setSolving(false);
    }
  };

  const buildText = () => {
    const lines: string[] = [];
    lines.push(`NSAGPT — ${subjectLabel} Solved Problems`);
    if (topic) lines.push(`Topic: ${topic}`);
    lines.push('');
    solutions.forEach((s, i) => {
      lines.push(`Q${i + 1}. ${s.problem_text}   [${s.marks} marks]`);
      if (s.given.length) lines.push(`Given: ${s.given.join(', ')}`);
      if (s.formula) lines.push(`Formula: ${s.formula}`);
      s.steps.forEach((step, j) => lines.push(`  ${j + 1}. ${step}`));
      lines.push(`Answer: ${s.final_answer}${s.units ? ` ${s.units}` : ''}`);
      if (s.concept) lines.push(`Concept: ${s.concept}`);
      lines.push('');
    });
    return lines.join('\n');
  };

  const handleDownload = () => {
    const blob = new Blob([buildText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subjectLabel}_solutions.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const esc = (t: string) =>
      t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    win.document.write(`<!doctype html><html><head><title>${subjectLabel} Solutions</title>
      <style>body{font-family:Georgia,serif;max-width:800px;margin:32px auto;line-height:1.6;${
        isUrdu ? 'direction:rtl;text-align:right;' : ''
      }}h1{font-size:20px}h2{font-size:15px;margin:20px 0 6px}ol{margin:4px 0 4px 20px}.ans{font-weight:700}</style>
      </head><body><h1>${subjectLabel} Solved Problems${topic ? ` — ${esc(topic)}` : ''}</h1>
      ${solutions
        .map(
          (s, i) => `<h2>Q${i + 1}. ${esc(s.problem_text)} [${s.marks} marks]</h2>
        ${s.given.length ? `<div>Given: ${esc(s.given.join(', '))}</div>` : ''}
        ${s.formula ? `<div>Formula: ${esc(s.formula)}</div>` : ''}
        <ol>${s.steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ol>
        <div class="ans">Answer: ${esc(s.final_answer)}${s.units ? ` ${esc(s.units)}` : ''}</div>
        ${s.concept ? `<div><em>${esc(s.concept)}</em></div>` : ''}`,
        )
        .join('')}
      </body></html>`);
    win.document.close();
    win.print();
  };

  if (solving) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 items-center justify-center text-white mb-6 shadow-lg shadow-primary-500/30 animate-pulse-glow">
          <Calculator size={34} />
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Solving your {subjectLabel.toLowerCase()} problems
        </h2>
        <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Reading the material, applying formulas and checking every step...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Physics / Math Solver
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload or paste numericals and get fully worked, step-by-step solutions. Everything you
          solve is saved to your History and Question Bank automatically.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-error-200 dark:border-error-800/50 bg-error-50 dark:bg-error-900/20 px-4 py-3 text-sm text-error-700 dark:text-error-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-success-200 dark:border-success-800/50 bg-success-50 dark:bg-success-900/20 px-4 py-3 text-sm text-success-700 dark:text-success-300 flex items-center gap-2">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Problem material</h2>
            </div>
            <FileUpload onAttachmentsChange={setAttachments} />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              dir={isUrdu ? 'rtl' : 'ltr'}
              placeholder={
                subjectArea === 'physics'
                  ? 'Paste numericals here, e.g. A car accelerates from 5 m/s to 25 m/s in 4 s. Find acceleration and distance covered.'
                  : 'Paste problems here, e.g. Solve 2x^2 - 5x - 3 = 0 and find the value of dy/dx for y = 3x^3 + 2x.'
              }
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </Card>

          {solutions.length > 0 && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Solutions
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {solutions.length} problems • {totalMarks} total marks
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="secondary" onClick={handlePrint}>
                    <Printer size={16} /> Print / PDF
                  </Button>
                  <Button variant="secondary" onClick={handleDownload}>
                    <Download size={16} /> Download
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/dashboard/bank')}>
                    <Archive size={16} /> Question Bank
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {solutions.map((s, i) => (
                  <div
                    key={i}
                    dir={isUrdu ? 'rtl' : 'ltr'}
                    className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4 space-y-3 ${
                      isUrdu ? 'text-right' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        Q{i + 1}. {s.problem_text}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="accent">{s.marks} marks</Badge>
                        <Badge variant="primary">{s.difficulty}</Badge>
                      </div>
                    </div>

                    {s.given.length > 0 && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-semibold">Given:</span> {s.given.join(', ')}
                      </p>
                    )}
                    {s.formula && (
                      <p className="text-sm font-mono text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2">
                        {s.formula}
                      </p>
                    )}
                    {s.steps.length > 0 && (
                      <ol className="space-y-1.5 text-sm text-slate-700 dark:text-slate-200 list-decimal ps-5">
                        {s.steps.map((step, j) => (
                          <li key={j} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    )}
                    <p className="text-sm font-semibold text-success-700 dark:text-success-400 bg-success-50 dark:bg-success-900/20 rounded-lg px-3 py-2">
                      Answer: {s.final_answer}
                      {s.units ? ` ${s.units}` : ''}
                    </p>
                    {s.concept && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        {s.concept}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5 space-y-5">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Solver settings</h2>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                <Sigma size={15} /> Subject
              </label>
              <SegmentedControl<SubjectArea>
                value={subjectArea}
                onChange={setSubjectArea}
                options={[
                  { value: 'physics', label: 'Physics', icon: <Atom size={15} /> },
                  { value: 'math', label: 'Mathematics', icon: <Calculator size={15} /> },
                ]}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                <Languages size={15} /> Language
              </label>
              <SegmentedControl<Language>
                value={language}
                onChange={setLanguage}
                options={[
                  { value: 'english', label: 'English' },
                  { value: 'urdu', label: 'Urdu' },
                  { value: 'mixed', label: 'Mixed' },
                ]}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                <ListOrdered size={15} /> Solution detail
              </label>
              <SegmentedControl<'detailed' | 'concise'>
                value={detail}
                onChange={setDetail}
                options={[
                  { value: 'detailed', label: 'Detailed steps' },
                  { value: 'concise', label: 'Short working' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                Topic / chapter (optional)
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Motion, Quadratic Equations"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                Maximum problems to solve
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={limit}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setLimit(Number.isFinite(n) && n > 0 ? Math.min(n, 40) : 1);
                }}
                className="w-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <Button className="w-full" onClick={handleSolve} disabled={!hasMaterial}>
              <Sparkles size={16} /> Solve {subjectLabel}
            </Button>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Images, PDFs, Word files and plain text are all supported — handwritten numericals are
              read with OCR.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
