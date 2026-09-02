import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, GraduationCap, Landmark, Search } from 'lucide-react';
import { useBoard } from '@/context/BoardContext';
import { CLASS_LEVELS, groupByRegion } from '@/lib/boards';
import { getBoardStyle } from '@/lib/boardStyles';

/** Compact board picker used inside the Generate settings card. */
export function BoardSelector({ compact = false }: { compact?: boolean }) {
  const { boards, board, boardCode, classLevel, setBoard, setClassLevel } = useBoard();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? boards.filter((b) => b.name.toLowerCase().includes(q) || b.region.toLowerCase().includes(q))
      : boards;
    return groupByRegion(filtered);
  }, [boards, query]);

  const style = getBoardStyle(board?.style);

  return (
    <div className="space-y-3">
      <div ref={wrapRef} className="relative">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Landmark size={16} className="text-slate-400" />
          Board
        </label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-left text-slate-800 dark:text-slate-100 hover:border-primary-400 transition-colors"
        >
          <span className="truncate">{board?.name ?? 'Select your board'}</span>
          <ChevronDown size={16} className={`flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-40 mt-2 w-full max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl animate-fade-in-down">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-2 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search board..."
                  className="w-full !pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            {groups.length === 0 && (
              <p className="px-4 py-6 text-sm text-center text-slate-400">No board matched your search.</p>
            )}
            {groups.map((group) => (
              <div key={group.region} className="py-1">
                <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {group.region}
                </p>
                {group.boards.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => {
                      setBoard(b.code);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-left transition-colors ${
                      boardCode === b.code
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    {boardCode === b.code && <Check size={15} className="flex-shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <GraduationCap size={16} className="text-slate-400" />
          Class
        </label>
        <div className="flex flex-wrap gap-2">
          {CLASS_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setClassLevel(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                classLevel === level
                  ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md shadow-primary-500/25'
                  : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {!compact && (
        <p className="text-xs text-slate-500 dark:text-slate-400 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-2">
          Paper style: <span className="font-semibold">{style.label}</span>
          {board ? ' — saved automatically for next time.' : ' — pick a board to match your exam format.'}
        </p>
      )}
    </div>
  );
}

/** Small header chip that opens the same board picker. */
export function BoardChip() {
  const { board } = useBoard();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-primary-400 transition-colors max-w-[190px]"
      >
        <Landmark size={13} className="text-primary-500 flex-shrink-0" />
        <span className="truncate">{board?.name ?? 'Select board'}</span>
        <ChevronDown size={13} className="flex-shrink-0 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-4 animate-fade-in-down">
          <BoardSelector compact />
        </div>
      )}
    </div>
  );
}
