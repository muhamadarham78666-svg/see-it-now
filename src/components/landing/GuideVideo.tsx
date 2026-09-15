import { PlayCircle } from 'lucide-react';
import { GuideAnimation } from '@/components/landing/GuideAnimation';

interface GuideVideoProps {
  videoRef?: (el: HTMLElement | null) => void;
}

const guideSteps = [
  'What NSAGPT is',
  'How to upload a chapter',
  'How to paste/write content',
  'Selecting English or Urdu',
  'Choosing MCQ / Short / Long',
  'Setting question count',
  'Choosing difficulty',
  'How AI analyzes content',
  'How questions appear',
  'Editing questions',
  'Creating a question paper',
  'Exporting / printing',
];

export function GuideVideo({ videoRef }: GuideVideoProps) {
  return (
    <section ref={videoRef} className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <PlayCircle size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">See How NSAGPT Works</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">A quick guided walkthrough</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-start">
            {/* Left: video */}
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-[300px] sm:h-[380px] lg:h-[400px]">
              <GuideAnimation />
            </div>

            {/* Right: what you'll learn */}
            <ol className="space-y-2 sm:space-y-3 lg:space-y-4">
              {guideSteps.map((step, i) => (
                <li key={step} className="flex gap-1.5 sm:gap-2.5 lg:gap-3 min-w-0">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-[11px] sm:text-sm lg:text-sm font-semibold text-slate-900 dark:text-white pt-0.5 leading-tight">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
