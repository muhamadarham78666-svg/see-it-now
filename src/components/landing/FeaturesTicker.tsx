const ITEMS = [
  'Board-pattern papers',
  'MCQ · Short · Long',
  'Urdu & English',
  'Classes 9–12',
  'Physics & Math step-by-step',
  'Book Solver',
  'AI Notes',
  'Question Bank',
  'Attempt Any rules',
  'Diagrams in papers',
  'PDF & Word export',
  'Paper history',
  'Watermark & footer',
  'Works with scans & images',
];

/** Continuous right → left strip of platform highlights. */
export function FeaturesTicker() {
  return (
    <div className="relative overflow-hidden border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10" />
      <div className="flex w-max animate-marquee gap-8 motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-8" aria-hidden={copy === 1}>
            {ITEMS.map((item) => (
              <span
                key={item}
                className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
