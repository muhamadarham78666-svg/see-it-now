import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Upload, Settings2, Brain, CheckCircle, Newspaper, Download } from 'lucide-react';

const TOTAL_DURATION = 30;

interface Scene {
  start: number;
  end: number;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
}

const scenes: Scene[] = [
  { start: 0, end: 4, title: 'NSAGPT', subtitle: 'AI Question & Paper Generator — Turn Your Study Material Into Smart Questions', icon: Sparkles },
  { start: 4, end: 9, title: '1. Upload Your Chapter', subtitle: 'PDF • DOC • TXT • Image — Drag & drop or browse', icon: Upload },
  { start: 9, end: 14, title: '2. Choose Your Settings', subtitle: 'English / Urdu • MCQ / Short / Long / Mixed • Count & Difficulty', icon: Settings2 },
  { start: 14, end: 20, title: '3. AI Understands Your Material', subtitle: 'Reading chapter... Identifying important topics... Generating questions...', icon: Brain },
  { start: 20, end: 25, title: '4. Review & Edit Your Questions', subtitle: 'MCQs • Short Questions • Long Questions — Edit, save, organize', icon: CheckCircle },
  { start: 25, end: 30, title: 'Build Your Paper', subtitle: 'Create professional exam papers — Download / Print', icon: Newspaper },
];

export function GuideAnimation() {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const tick = useCallback((now: number) => {
    const elapsedMs = now - startTimeRef.current;
    const newElapsed = elapsedMs / 1000;

    if (newElapsed >= TOTAL_DURATION) {
      setElapsed(TOTAL_DURATION);
      setPlaying(false);
      return;
    }

    setElapsed(newElapsed);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(() => {
    if (elapsed >= TOTAL_DURATION) {
      setElapsed(0);
      pausedAtRef.current = 0;
    }
    startTimeRef.current = performance.now() - pausedAtRef.current * 1000;
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [elapsed, tick]);

  const pause = useCallback(() => {
    setPlaying(false);
    pausedAtRef.current = elapsed;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [elapsed]);

  const restart = useCallback(() => {
    setElapsed(0);
    pausedAtRef.current = 0;
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const currentScene = scenes.find((s) => elapsed >= s.start && elapsed < s.end) ?? scenes[0];
  const sceneIndex = scenes.indexOf(currentScene);
  const sceneProgress = (elapsed - currentScene.start) / (currentScene.end - currentScene.start);
  const overallProgress = (elapsed / TOTAL_DURATION) * 100;

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-primary-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:30px_30px] opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Scene content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 sm:p-10 text-center">
        <div className="mb-6 transition-all duration-500" key={sceneIndex}>
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-xl shadow-primary-500/30 mx-auto mb-4 animate-fade-in-up">
            <currentScene.icon size={36} />
          </div>
        </div>

        <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-3 animate-fade-in-up" key={`title-${sceneIndex}`}>
          {currentScene.title}
        </h3>
        <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed animate-fade-in" key={`sub-${sceneIndex}`}>
          {currentScene.subtitle}
        </p>

        {/* Scene-specific visual */}
        <div className="mt-6 w-full max-w-sm">
          <SceneVisual sceneIndex={sceneIndex} progress={sceneProgress} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-1 bg-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-100"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/50 backdrop-blur-sm">
          <span className="text-xs text-slate-400 tabular-nums">
            {Math.floor(elapsed)}s / {TOTAL_DURATION}s
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={restart}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Restart"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={playing ? pause : play}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Play overlay when not started */}
      {elapsed === 0 && !playing && (
        <button
          onClick={play}
          className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm transition-opacity hover:bg-slate-950/30 z-10"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 animate-pulse-glow">
            <Play size={32} className="text-white ml-1" fill="white" />
          </div>
        </button>
      )}

      {/* Final frame */}
      {elapsed >= TOTAL_DURATION && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20">
          <div className="text-center animate-fade-in">
            <h3 className="font-display text-2xl font-bold text-white mb-1">NSAGPT</h3>
            <p className="text-slate-300 text-sm mb-1">AI Question & Paper Generator</p>
            <p className="text-primary-400 text-xs font-medium">Developed by ZK SOLUTIONS</p>
            <button
              onClick={restart}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white text-sm font-medium shadow-lg shadow-primary-500/25 hover:scale-105 transition-transform"
            >
              <RotateCcw size={16} /> Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SceneVisual({ sceneIndex, progress }: { sceneIndex: number; progress: number }) {
  if (sceneIndex === 0) {
    return (
      <div className="flex items-center justify-center gap-3">
        {['MCQ', 'Short', 'Long'].map((t, i) => (
          <div key={t} className="glass rounded-lg px-4 py-2 animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="text-sm font-medium text-white">{t}</div>
          </div>
        ))}
      </div>
    );
  }

  if (sceneIndex === 1) {
    return (
      <div className="border-2 border-dashed border-white/20 rounded-xl p-6 animate-fade-in">
        <Upload size={28} className="text-primary-400 mx-auto mb-2" />
        <div className="text-xs text-slate-400 mb-2">chapter_photosynthesis.pdf</div>
        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
        </div>
      </div>
    );
  }

  if (sceneIndex === 2) {
    return (
      <div className="space-y-2 animate-fade-in">
        {['English / Urdu', 'MCQ / Short / Long', '20 Questions • Medium'].map((s, i) => (
          <div key={i} className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-xs text-slate-300">
            <CheckCircle size={14} className="text-success-400" /> {s}
          </div>
        ))}
      </div>
    );
  }

  if (sceneIndex === 3) {
    const labels = ['Reading chapter...', 'Identifying important topics...', 'Generating questions...'];
    return (
      <div className="space-y-2">
        {labels.map((label, i) => {
          const active = progress * 3 > i;
          return (
            <div key={i} className={`flex items-center gap-2 glass rounded-lg px-3 py-2 transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-4 h-4 rounded-full border-2 ${active ? 'border-primary-400 border-t-transparent animate-spin' : 'border-slate-500'}`} />
              <span className="text-xs text-slate-300">{label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (sceneIndex === 4) {
    return (
      <div className="space-y-2">
        {[
          { type: 'MCQ', text: 'What is the primary function of chlorophyll?', count: 8 },
          { type: 'Short', text: 'Define photosynthesis in one sentence.', count: 6 },
          { type: 'Long', text: 'Explain the light and dark reactions...', count: 6 },
        ].map((q, i) => (
          <div key={i} className="glass rounded-lg p-3 text-left animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary-400">{q.type}</span>
              <span className="text-xs text-slate-500">{q.count} questions</span>
            </div>
            <p className="text-xs text-slate-300">{q.text}</p>
          </div>
        ))}
      </div>
    );
  }

  if (sceneIndex === 5) {
    return (
      <div className="space-y-2">
        <div className="glass rounded-lg p-4 text-left">
          <div className="text-center border-b border-white/10 pb-2 mb-2">
            <p className="text-xs font-bold text-white">Academy Examination</p>
            <p className="text-xs text-slate-400">Subject: Biology • Total Marks: 100</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-300">Section A — MCQs (20 marks)</p>
            <p className="text-xs text-slate-300">Section B — Short Questions (30 marks)</p>
            <p className="text-xs text-slate-300">Section C — Long Questions (50 marks)</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 animate-fade-in">
          <span className="glass rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-1.5">
            <Download size={12} /> PDF
          </span>
          <span className="glass rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-1.5">
            <Newspaper size={12} /> Print
          </span>
        </div>
      </div>
    );
  }

  return null;
}
