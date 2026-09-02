import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { fetchBoards, findBoard, FALLBACK_BOARDS, type Board } from '@/lib/boards';

const LS_BOARD = 'nsagpt.board.code';
const LS_CLASS = 'nsagpt.board.class';

interface BoardContextValue {
  boards: Board[];
  boardCode: string | null;
  classLevel: string | null;
  board: Board | null;
  /** True until the saved preference has been read. */
  loading: boolean;
  setBoard: (code: string) => void;
  setClassLevel: (level: string) => void;
}

const BoardContext = createContext<BoardContextValue | undefined>(undefined);

export function BoardProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [boards, setBoards] = useState<Board[]>(FALLBACK_BOARDS);
  const [boardCode, setBoardCode] = useState<string | null>(null);
  const [classLevel, setClassLevelState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchBoards().then((list) => {
      if (active) setBoards(list);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Local value first for an instant, flicker-free render.
    if (typeof window !== 'undefined') {
      setBoardCode(localStorage.getItem(LS_BOARD));
      setClassLevelState(localStorage.getItem(LS_CLASS));
    }

    if (!session) {
      setLoading(false);
      return;
    }

    let active = true;
    supabase
      .from('profiles')
      .select('board_code, class_level')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data?.board_code) {
          setBoardCode(data.board_code);
          try {
            localStorage.setItem(LS_BOARD, data.board_code);
          } catch {
            /* ignore */
          }
        }
        if (data?.class_level) {
          setClassLevelState(data.class_level);
          try {
            localStorage.setItem(LS_CLASS, data.class_level);
          } catch {
            /* ignore */
          }
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const persist = useCallback(
    async (patch: { board_code?: string; class_level?: string }) => {
      if (!session) return;
      await supabase.from('profiles').update(patch).eq('id', session.user.id);
    },
    [session],
  );

  const setBoard = useCallback(
    (code: string) => {
      setBoardCode(code);
      try {
        localStorage.setItem(LS_BOARD, code);
      } catch {
        /* ignore */
      }
      void persist({ board_code: code });
    },
    [persist],
  );

  const setClassLevel = useCallback(
    (level: string) => {
      setClassLevelState(level);
      try {
        localStorage.setItem(LS_CLASS, level);
      } catch {
        /* ignore */
      }
      void persist({ class_level: level });
    },
    [persist],
  );

  const value = useMemo<BoardContextValue>(
    () => ({
      boards,
      boardCode,
      classLevel,
      board: findBoard(boards, boardCode),
      loading,
      setBoard,
      setClassLevel,
    }),
    [boards, boardCode, classLevel, loading, setBoard, setClassLevel],
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoard must be used within BoardProvider');
  return ctx;
}
