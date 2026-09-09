import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { LANGUAGES, languageDef } from '@/lib/i18n';

/** Header chip that switches the whole dashboard language. Sits next to the board chip. */
export function LanguageChip() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = languageDef(lang);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={t('common.language')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-primary-400 transition-colors"
      >
        <Languages size={13} className="text-primary-500 flex-shrink-0" />
        <span className="truncate max-w-[90px]">{current.label}</span>
        <ChevronDown size={13} className="flex-shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl py-2 animate-fade-in-down max-h-80 overflow-y-auto">
          <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t('common.language')}
          </p>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-left transition-colors ${
                lang === l.code
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
            >
              <span className="truncate">
                <span className="mr-2">{l.flag}</span>
                {l.label}
              </span>
              {lang === l.code && <Check size={15} className="flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
