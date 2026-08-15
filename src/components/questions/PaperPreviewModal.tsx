import { useMemo, useState } from 'react';
import { X, Printer, Download, FileText, Eye, EyeOff } from 'lucide-react';
import { buildPaperHtml, buildPaperText, downloadFile, type PaperMeta } from '@/lib/paperExport';
import type { Question } from '@/types';

interface PaperPreviewModalProps {
  open: boolean;
  onClose: () => void;
  questions: Question[];
  defaultMeta: PaperMeta;
}

export function PaperPreviewModal({ open, onClose, questions, defaultMeta }: PaperPreviewModalProps) {
  const [meta, setMeta] = useState<PaperMeta>(defaultMeta);
  const [withAnswers, setWithAnswers] = useState(false);

  const html = useMemo(
    () => buildPaperHtml(meta, questions, { withAnswers }),
    [meta, questions, withAnswers],
  );

  if (!open) return null;

  const fileBase = (meta.title || 'question-paper').replace(/[^\w\u0600-\u06FF-]+/g, '_');

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const field = (label: string, key: keyof PaperMeta, placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <input
        value={(meta[key] as string) ?? ''}
        onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value }))}
        placeholder={placeholder}
        className="input-field text-sm"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-6xl h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={18} className="text-primary-500 flex-shrink-0" />
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white truncate">
              Preview & Download
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 grid lg:grid-cols-[300px_1fr]">
          <div className="p-5 space-y-3 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700">
            {field('Paper Title', 'title', 'Half Book Test')}
            {field('Institution', 'institutionName', 'NSA School')}
            {field('Exam Name', 'examName', 'Monthly Test')}
            {field('Subject', 'subject', 'Biology')}
            {field('Class', 'className', '10th')}
            {field('Chapter', 'chapter', 'Chapter 1')}
            {field('Date', 'examDate', '2026-08-16')}
            {field('Time', 'examTime', '1 Hour')}
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
            <button
              onClick={() => setWithAnswers((v) => !v)}
              className="btn-secondary w-full justify-center text-sm"
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
          <button onClick={handlePrint} className="btn-primary text-sm">
            <Printer size={16} /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
