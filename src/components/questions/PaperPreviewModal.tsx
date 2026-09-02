import { useMemo, useRef, useState } from 'react';
import { X, Printer, Download, FileText, Eye, EyeOff, ImagePlus, Trash2, Building2, CalendarDays, ListChecks } from 'lucide-react';
import { buildPaperHtml, buildPaperText, downloadFile, printHtml, type PaperMeta } from '@/lib/paperExport';
import { BOARD_STYLE_OPTIONS } from '@/lib/boardStyles';
import type { Question } from '@/types';

interface PaperPreviewModalProps {
  open: boolean;
  onClose: () => void;
  questions: Question[];
  defaultMeta: PaperMeta;
}

const LOGO_KEY = 'nsagpt.paper.logo';

export function PaperPreviewModal({ open, onClose, questions, defaultMeta }: PaperPreviewModalProps) {
  const [meta, setMeta] = useState<PaperMeta>(() => ({
    ...defaultMeta,
    logoUrl:
      defaultMeta.logoUrl ??
      (typeof window === 'undefined' ? undefined : localStorage.getItem(LOGO_KEY) ?? undefined),
  }));
  const [withAnswers, setWithAnswers] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const html = useMemo(
    () => buildPaperHtml(meta, questions, { withAnswers }),
    [meta, questions, withAnswers],
  );

  if (!open) return null;

  const fileBase = (meta.title || 'question-paper').replace(/[^\w\u0600-\u06FF-]+/g, '_');

  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file (PNG or JPG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be smaller than 2MB.');
      return;
    }
    setLogoError(null);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read logo'));
      reader.readAsDataURL(file);
    });
    setMeta((m) => ({ ...m, logoUrl: dataUrl }));
    try {
      localStorage.setItem(LOGO_KEY, dataUrl);
    } catch {
      // storage full — logo still applies to this paper
    }
  };

  const removeLogo = () => {
    setMeta((m) => ({ ...m, logoUrl: undefined }));
    try {
      localStorage.removeItem(LOGO_KEY);
    } catch {
      // ignore
    }
  };

  const field = (label: string, key: keyof PaperMeta, placeholder = '', type = 'text') => (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={(meta[key] as string) ?? ''}
        onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value }))}
        placeholder={placeholder}
        className="input-field text-sm !py-2"
      />
    </div>
  );

  const groupTitle = (icon: React.ReactNode, text: string) => (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 pt-1">
      {icon}
      {text}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-6xl h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={18} className="text-primary-500 flex-shrink-0" />
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white truncate">
              Preview &amp; Download
            </h2>
            <span className="hidden sm:inline text-xs text-slate-400 ml-2">
              {questions.length} questions · {questions.reduce((s, q) => s + (q.marks || 0), 0)} marks
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 grid lg:grid-cols-[320px_1fr]">
          <div className="p-5 space-y-3 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700">
            {groupTitle(<Building2 size={13} />, 'Institution & Logo')}
            {field('Institution Name', 'institutionName', 'NSA School System')}

            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-3">
              <div className="flex items-center gap-3">
                {meta.logoUrl ? (
                  <img
                    src={meta.logoUrl}
                    alt="Paper logo preview"
                    className="h-12 w-12 object-contain rounded-lg bg-white border border-slate-200"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                    <ImagePlus size={18} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">School logo (optional)</p>
                  <p className="text-[11px] text-slate-400">PNG / JPG, up to 2MB. Saved for next time.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => logoInput.current?.click()} className="btn-secondary text-xs flex-1 justify-center">
                  <ImagePlus size={14} /> {meta.logoUrl ? 'Change' : 'Add logo'}
                </button>
                {meta.logoUrl && (
                  <button onClick={removeLogo} className="btn-secondary text-xs text-error-500">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {logoError && <p className="text-[11px] text-error-500 mt-2">{logoError}</p>}
              <input
                ref={logoInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogo(e.target.files?.[0])}
              />
            </div>

            {groupTitle(<ListChecks size={13} />, 'Paper Details')}
            {field('Paper Title', 'title', 'Half Book Test')}
            {field('Exam Name', 'examName', 'Monthly Test')}
            <div className="grid grid-cols-2 gap-3">
              {field('Subject', 'subject', 'Biology')}
              {field('Class', 'className', '10th')}
            </div>
            {field('Chapter', 'chapter', 'Chapter 1')}
            {field('Board / Authority', 'boardName', 'Punjab Board (BISE Lahore)')}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Paper Style
              </label>
              <select
                value={meta.boardStyle ?? 'punjab'}
                onChange={(e) => setMeta((m) => ({ ...m, boardStyle: e.target.value as PaperMeta['boardStyle'] }))}
                className="input-field text-sm !py-2"
              >
                {BOARD_STYLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>



            {groupTitle(<CalendarDays size={13} />, 'Schedule')}
            <div className="grid grid-cols-2 gap-3">
              {field('Date', 'examDate', '', 'date')}
              {field('Time Allowed', 'examTime', '1 Hour')}
            </div>

            {groupTitle(<FileText size={13} />, 'Instructions & Footer')}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Instructions</label>
              <textarea
                value={meta.instructions ?? ''}
                onChange={(e) => setMeta((m) => ({ ...m, instructions: e.target.value }))}
                rows={3}
                placeholder="Attempt all questions..."
                className="input-field text-sm resize-y"
              />
            </div>
            {field('Footer note', 'footerNote', 'Best of luck!')}

            <button
              onClick={() => setWithAnswers((v) => !v)}
              className="btn-secondary w-full justify-center text-sm mt-2"
            >
              {withAnswers ? <EyeOff size={16} /> : <Eye size={16} />}
              {withAnswers ? 'Hide answer key' : 'Show answer key'}
            </button>
          </div>

          <div className="min-h-0 overflow-hidden bg-slate-100 dark:bg-slate-900 p-3">
            <iframe
              title="Paper preview"
              srcDoc={html}
              className="w-full h-full rounded-xl bg-white shadow-inner"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => downloadFile(`${fileBase}.txt`, buildPaperText(meta, questions, withAnswers), 'text/plain;charset=utf-8')}
            className="btn-secondary text-sm"
          >
            <Download size={16} /> TXT
          </button>
          <button
            onClick={() => downloadFile(`${fileBase}.html`, html, 'text/html;charset=utf-8')}
            className="btn-secondary text-sm"
          >
            <Download size={16} /> HTML
          </button>
          <button onClick={() => printHtml(html)} className="btn-primary text-sm">
            <Printer size={16} /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
