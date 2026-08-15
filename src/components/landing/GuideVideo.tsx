import { useState } from 'react';
import { Play, X, Clock, Video } from 'lucide-react';
import { GuideAnimation } from '@/components/landing/GuideAnimation';

interface GuideVideoProps {
  videoRef?: (el: HTMLElement | null) => void;
}

export function GuideVideo({ videoRef }: GuideVideoProps) {
  const [playing, setPlaying] = useState(false);

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

  return (
    <section ref={videoRef} className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-sm font-medium mb-4">
            <Video size={16} />
            Tutorial
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            See How NSAGPT Works
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Watch a quick 30-second guide covering everything from uploading material to exporting your question paper.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Video player */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl group">
              {!playing ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-accent-900">
                    <div className="absolute inset-0 bg-grid-pattern bg-[size:30px_30px] opacity-20" />
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/30 rounded-full blur-3xl animate-pulse-glow" />
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-500/30 rounded-full blur-3xl animate-pulse-glow" />
                  </div>

                  <div className="relative h-full flex flex-col items-center justify-center gap-6 p-8 text-center">
                    <button
                      onClick={() => setPlaying(true)}
                      className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 animate-pulse-glow"
                    >
                      <Play size={32} className="text-white ml-1" fill="white" />
                    </button>
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-white mb-2">
                        NSAGPT Complete Guide
                      </h3>
                      <p className="text-slate-300 text-sm max-w-md">
                        Learn how to generate questions and build papers from your study material.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Clock size={16} />
                      <span>~30 seconds</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative h-full w-full">
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={() => setPlaying(false)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <GuideAnimation />
                </div>
              )}
            </div>
          </div>

          {/* What you'll learn */}
          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-4">
              What You'll Learn
            </h3>
            <ul className="space-y-3">
              {guideSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
