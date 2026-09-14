import { useEffect, useState } from 'react';
import { usdPkrRateFn } from '@/lib/rates.functions';

/** Live USD → PKR rate badge with a blinking green dot. Refreshes every 60s. */
export function LiveRateTicker() {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      void usdPkrRateFn()
        .then((r) => {
          if (active) setRate(r.rate);
        })
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (rate === null) return null;

  return (
    <div className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 text-[9px] sm:px-3 sm:py-1 sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300">
      <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-success-500" />
      </span>
      <span className="text-success-600 dark:text-success-400 tracking-wide">LIVE</span>
      <span className="tabular-nums">$1 = Rs. {rate.toLocaleString('en-US')}</span>
    </div>
  );
}
