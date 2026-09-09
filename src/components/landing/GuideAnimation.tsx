import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Sparkles, GraduationCap, Settings2, Brain, CheckCircle, Newspaper, Download, Layers, Wand2, BookOpen, PenLine } from 'lucide-react';

const TOTAL_DURATION = 30;

interface Scene {
  start: number;
  end: number;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
}

const scenes: Scene[] = [
  { start: 0, end: 3.5, title: 'NSAGPT', subtitle: 'AI Paper Generator for Pakistani Boards — study material se smart board-pattern papers', icon: Sparkles },
  { start: 3.5, end: 7.5, title: '1. Board & Book Select Karein', subtitle: 'Punjab • Sindh • Federal • KPK — Class 9 se 12 tak, latest 2026 books', icon: GraduationCap },
  { start: 7.5, end: 11.5, title: '2. Pattern & Range Choose Karein', subtitle: 'Full / Half book ya chapter-wise — MCQ, Short, Long counts & difficulty', icon: Settings2 },
  { start: 11.5, end: 15.5, title: '3. Special Instructions Likhein', subtitle: '"Attempt any 3 of 5" • Urdu paper • diagrams • translation — jo likhein wohi bane', icon: PenLine },
  { start: 15.5, end: 19.5, title: '4. AI Paper Generate Kare', subtitle: 'Syllabus parhna → board pattern apply → questions generate — best approach suggestion ke sath', icon: Brain },
  { start: 19.5, end: 23.5, title: '5. Preview & Edit', subtitle: 'Statement / مفہوم • parts (a) (b) • chapter-wise question bank — edit, reorder, save', icon: CheckCircle },
  { start: 23.5, end: 27, title: '6. Download & Print', subtitle: 'Board-styled paper apne logo ke sath — PDF / Print ready', icon: Newspaper },
  { start: 27, end: 30, title: 'Aur Bhi Bohat Kuch', subtitle: 'Physics/Math Solver • AI Notes • Book Solver • NSAGPT AI — sab ek jagah', icon: Layers },
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

      {/* Step dots */}
      <div className="absolute top-3 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
        {scenes.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === sceneIndex ? 'w-6 bg-primary-400' : i < sceneIndex ? 'w-2 bg-primary-600/60' : 'w-2 bg-slate-600/60'
            }`}
          />
        ))}
      </div>

      {/* Scene content */}
      <div className="relative h-full min-h-0 flex flex-col items-center justify-center p-6 sm:p-10 pt-8 text-center overflow-y-auto">
        <div className="mb-4 transition-all duration-500" key={sceneIndex}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-xl shadow-primary-500/30 mx-auto mb-3 animate-fade-in-up">
            <currentScene.icon size={30} />
          </div>
        </div>

        <h3 className="font-display text-lg sm:text-2xl font-bold text-white mb-2 animate-fade-in-up" key={`title-${sceneIndex}`}>
          {currentScene.title}
        </h3>
        <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed animate-fade-in" key={`sub-${sceneIndex}`}>
          {currentScene.subtitle}
        </p>

        {/* Scene-specific visual */}
        <div className="mt-5 w-full max-w-sm shrink-0">
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
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {['MCQ', 'Short', 'Long', 'اردو', 'Diagrams'].map((t, i) => (
          <div key={t} className="glass rounded-lg px-3 py-1.5 animate-fade-in-up" style={{ animationDelay: `${i * 0.12}s` }}>
            <div className="text-xs font-medium text-white">{t}</div>
          </div>
        ))}
      </div>
    );
  }

  if (sceneIndex === 1) {
    return (
      <div className="space-y-2 animate-fade-in">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {['Punjab', 'Sindh', 'Federal', 'KPK'].map((b, i) => (
            <span key={b} className={`glass rounded-full px-3 py-1 text-[11px] transition-all ${i === 0 ? 'text-primary-300 border border-primary-500/50' : 'text-slate-400'}`}>
              {b}
            </span>
          ))}
        </div>
        <div className="glass rounded-lg p-3 text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <GraduationCap size={13} className="text-primary-400" />
            <span className="text-xs font-semibold text-white">Class 9 — Science Group</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Physics', 'Chemistry', 'Biology', 'Math', 'English', 'Urdu'].map((s) => (
              <span key={s} className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">{s}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sceneIndex === 2) {
    return (
      <div className="space-y-2 animate-fade-in">
        {['Full Book / Half Book / Chapter 1–4', 'MCQ 10 • Short 5 • Long 2', 'Board Pattern: Lahore Style'].map((s, i) => (
          <div key={i} className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-xs text-slate-300">
            <CheckCircle size={14} className="text-success-400" /> {s}
          </div>
        ))}
      </div>
    );
  }

  if (sceneIndex === 3) {
    const lines = ['"Attempt any 4 of 6 short questions"', '"Paper urdu mein ho"', '"Diagrams shamil karein"'];
    const shown = Math.min(Math.floor(progress * lines.length) + 1, lines.length);
    return (
      <div className="glass rounded-xl p-4 text-left space-y-2 animate-fade-in">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-primary-300 font-semibold">
          <Wand2 size={11} /> Special Instructions
        </div>
        {lines.slice(0, shown).map((l, i) => (
          <p key={i} className="text-xs text-slate-300 animate-fade-in">{l}</p>
        ))}
        <p className="text-[10px] text-slate-500">Jo likhein — wohi paper mein aaye ✦</p>
      </div>
    );
  }

  if (sceneIndex === 4) {
    const labels = ['Syllabus parh raha hai...', 'Board pattern apply...', 'Questions generate...'];
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

  if (sceneIndex === 5) {
    return (
      <div className="space-y-2">
        {[
          { type: 'MCQ', text: 'Q1 — (i) (ii) (iii)… har item apni line par', count: 10 },
          { type: 'Short', text: 'Attempt any 4 of 6 — مفہوم ke sath', count: 6 },
          { type: 'Long', text: 'Q3 (a) + (b) — parts ke sath', count: 2 },
        ].map((q, i) => (
          <div key={i} className="glass rounded-lg p-3 text-left animate-fade-in-up" style={{ animationDelay: `${i * 0.12}s` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary-400">{q.type}</span>
              <span className="text-xs text-slate-500">{q.count}</span>
            </div>
            <p className="text-xs text-slate-300">{q.text}</p>
          </div>
        ))}
      </div>
    );
  }

  if (sceneIndex === 6) {
    return (
      <div className="space-y-2">
        <div className="glass rounded-lg p-4 text-left">
          <div className="text-center border-b border-white/10 pb-2 mb-2">
            <p className="text-xs font-bold text-white">Academy Examination — Logo ✦</p>
            <p className="text-xs text-slate-400">Physics • Class 9 • Lahore Board Pattern</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-300">Section A — MCQs (12 marks)</p>
            <p className="text-xs text-slate-300">Section B — Short Questions (30 marks)</p>
            <p className="text-xs text-slate-300">Section C — Long Questions (33 marks)</p>
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

  if (sceneIndex === 7) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Brain, label: 'Physics/Math Solver' },
          { icon: PenLine, label: 'AI Notes Generator' },
          { icon: BookOpen, label: 'Book Solver' },
          { icon: Sparkles, label: 'NSAGPT AI' },
        ].map((f, i) => (
          <div key={i} className="glass rounded-lg p-3 flex flex-col items-center gap-1.5 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <f.icon size={16} className="text-primary-400" />
            <span className="text-[11px] text-slate-300">{f.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
