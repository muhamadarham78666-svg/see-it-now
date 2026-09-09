import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { languageDef, translate, type TransKey } from '@/lib/i18n';

const LS_LANG = 'nsagpt.ui.language';

interface LanguageContextValue {
  lang: string;
  /** English name of the language, sent to the AI so replies match. */
  langName: string;
  dir: 'ltr' | 'rtl';
  rtl: boolean;
  setLang: (code: string) => void;
  t: (key: TransKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LS_LANG);
      if (saved) setLangState(saved);
    }
    if (!session) return;
    let active = true;
    supabase
      .from('profiles')
      .select('ui_language')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data?.ui_language) return;
        setLangState(data.ui_language);
        try {
          localStorage.setItem(LS_LANG, data.ui_language);
        } catch {
          /* ignore */
        }
      });
    return () => {
      active = false;
    };
  }, [session]);

  const def = languageDef(lang);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = def.code === 'roman' ? 'ur-Latn' : def.code;
  }, [def.code]);

  const setLang = useCallback(
    (code: string) => {
      setLangState(code);
      try {
        localStorage.setItem(LS_LANG, code);
      } catch {
        /* ignore */
      }
      if (session) void supabase.from('profiles').update({ ui_language: code }).eq('id', session.user.id);
    },
    [session],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang: def.code,
      langName: def.english,
      dir: def.dir,
      rtl: def.dir === 'rtl',
      setLang,
      t: (key: TransKey) => translate(def.code, key),
    }),
    [def, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

const fallbackValue: LanguageContextValue = (() => {
  const def = languageDef('en');
  return {
    lang: def.code,
    langName: def.english,
    dir: def.dir,
    rtl: def.dir === 'rtl',
    setLang: () => {},
    t: (key: TransKey) => translate(def.code, key),
  };
})();

export function useLanguage() {
  return useContext(LanguageContext) ?? fallbackValue;
}
