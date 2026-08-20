import { useEffect, useMemo, useState } from 'react';
import { Download, ImagePlus, Printer, Trash2, X } from 'lucide-react';
import { buildNoteHtml, downloadFile, printHtml } from '@/lib/paperExport';

const LOGO_KEY = 'nsagpt.paper.logo';

interface NotePreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  subject?: string | null;
}

export function NotePreviewModal({ open, onClose, title, content, subject }: NotePreviewModalProps) {
  const [institutionName, setInstitutionName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLogoUrl(window.localStorage.getItem(LOGO_KEY) ?? '');
  }, [open]);

  const html = useMemo(
    () => buildNoteHtml({ title, content, subject, institutionName, logoUrl }),
    [title, content, subject, institutionName, logoUrl],
  );

  if (!open) return null;

  const fileBase = (title || 'note').replace(/[^\w\u0600-\u06FF-]+/g, '_');

  const pickLogo = async (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setLogoUrl(url);
      window.localStorage.setItem(LOGO_KEY, url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white truncate">
            Preview & Print Note
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Institution name (optional)
            </label>
            <input
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="NSA School"
              className="input-field text-sm"
            />
          </div>
          <label className="btn-secondary text-sm cursor-pointer">
            <ImagePlus size={16} /> {logoUrl ? 'Change logo' : 'Add logo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickLogo(e.target.files?.[0])}
            />
          </label>
          {logoUrl && (
            <button
              onClick={() => {
                setLogoUrl('');
                window.localStorage.removeItem(LOGO_KEY);
              }}
              className="btn-secondary text-sm text-error-500"
            >
              <Trash2 size={16} /> Remove logo
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-900 p-3">
          <iframe title="Note preview" srcDoc={html} className="w-full h-full rounded-xl bg-white" />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => downloadFile(`${fileBase}.txt`, `${title}\n\n${content}`, 'text/plain;charset=utf-8')}
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
