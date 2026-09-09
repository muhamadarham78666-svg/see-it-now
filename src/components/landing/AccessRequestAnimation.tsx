import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, User, Mail, MessageSquare, Send, CheckCircle, Loader2, MousePointer2 } from 'lucide-react';

const TOTAL_DURATION = 22;

interface Step {
  start: number;
  end: number;
  label: string;
}

const steps: Step[] = [
  { start: 0, end: 3, label: 'Step 1 — Open the Request Access form' },
  { start: 3, end: 6, label: 'Step 2 — Type your first name' },
  { start: 6, end: 9, label: 'Step 3 — Type your last name' },
  { start: 9, end: 12, label: 'Step 4 — Enter your email address' },
  { start: 12, end: 16, label: 'Step 5 — Write why you need access' },
  { start: 16, end: 19, label: 'Step 6 — Press "Submit Request"' },
  { start: 19, end: 22, label: 'Done — the admin will email your account' },
];

const DEMO = {
  firstName: 'Ahmad',
  lastName: 'Raza',
  email: 'ahmad.raza@school.edu.pk',
  note: 'Assalam-o-Alaikum, I am a Biology teacher at City Model School. I need NSAGPT access to generate board-pattern papers for my classes.',
};

/** Type text progressively over a time window. */
function typed(text: string, elapsed: number, start: number, end: number): string {
  if (elapsed <= start) return '';
  const p = Math.min((elapsed - start) / (end - start), 1);
  return text.slice(0, Math.round(text.length * p));
}

export function AccessRequestAnimation() {
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const tick = useCallback((now: number) => {
    const e = (now - startTimeRef.current) / 1000;
    if (e >= TOTAL_DURATION) {
      setElapsed(TOTAL_DURATION);
      setPlaying(false);
      return;
    }
    setElapsed(e);
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
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  const currentStep = steps.find((s) => elapsed >= s.start && elapsed < s.end) ?? steps[steps.length - 1];
  const stepIndex = steps.indexOf(currentStep);
  const overallProgress = (elapsed / TOTAL_DURATION) * 100;

  const firstName = typed(DEMO.firstName, elapsed, 3, 6);
  const lastName = typed(DEMO.lastName, elapsed, 6, 9);
  const email = typed(DEMO.email, elapsed, 9, 12);
  const note = typed(DEMO.note, elapsed, 12, 16);

  const activeField =
    stepIndex === 1 ? 'firstName' :
    stepIndex === 2 ? 'lastName' :
    stepIndex === 3 ? 'email' :
    stepIndex === 4 ? 'note' : null;

  const submitting = elapsed >= 16 && elapsed < 19;
  const done = elapsed >= 19;

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-primary-950 via-slate-900 to-slate-950 rounded-xl overflow-hidden group">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:30px_30px] opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl animate-pulse-glow" />

      {/* Demo form */}
      <div className="relative h-full flex flex-col p-4 sm:p-6 pb-16">
        <p className="text-center text-xs sm:text-sm font-medium text-primary-300 mb-3 animate-fade-in" key={stepIndex}>
          {currentStep.label}
        </p>

        {!done ? (
          <div className="w-full max-w-sm mx-auto bg-white/95 dark:bg-slate-800/95 rounded-xl p-4 sm:p-5 shadow-2xl space-y-3 text-left">
            <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">Request Access</h4>

            <div className="grid grid-cols-2 gap-2">
              <DemoInput
                icon={<User size={12} />}
                placeholder="First Name"
                value={firstName}
                active={activeField === 'firstName'}
                filled={firstName.length === DEMO.firstName.length}
              />
              <DemoInput
                icon={<User size={12} />}
                placeholder="Last Name"
                value={lastName}
                active={activeField === 'lastName'}
                filled={lastName.length === DEMO.lastName.length}
              />
            </div>

            <DemoInput
              icon={<Mail size={12} />}
              placeholder="Email"
              value={email}
              active={activeField === 'email'}
              filled={email.length === DEMO.email.length}
            />

            <div
              className={`relative rounded-lg border px-3 py-2 text-[11px] leading-relaxed min-h-[64px] transition-all ${
                activeField === 'note'
                  ? 'border-primary-500 ring-2 ring-primary-500/30'
                  : note
                    ? 'border-success-400'
                    : 'border-slate-200 dark:border-slate-600'
              } bg-white dark:bg-slate-900`}
            >
              <MessageSquare size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
              <p className="pl-5 text-slate-700 dark:text-slate-300">
                {note || <span className="text-slate-400">Why do you need access?</span>}
                {activeField === 'note' && <span className="inline-block w-px h-3 bg-primary-500 ml-0.5 animate-pulse align-middle" />}
              </p>
            </div>

            {/* Submit button with cursor animation */}
            <div className="relative pt-1">
              <button
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition-all ${
                  submitting
                    ? 'bg-primary-500 scale-95'
                    : 'bg-gradient-to-r from-primary-600 to-accent-500 shadow-lg shadow-primary-500/25'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Submit Request
                  </>
                )}
              </button>
              {elapsed >= 15 && elapsed < 16.6 && (
                <MousePointer2
                  size={18}
                  className="absolute text-slate-900 dark:text-white drop-shadow-lg animate-bounce"
                  style={{ right: '30%', bottom: '-2px' }}
                  fill="currentColor"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm mx-auto bg-white/95 dark:bg-slate-800/95 rounded-xl p-6 shadow-2xl text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-success-100 dark:bg-success-900/40 flex items-center justify-center text-success-600 dark:text-success-400 mx-auto mb-4">
              <CheckCircle size={28} />
            </div>
            <h4 className="font-display text-base font-bold text-slate-900 dark:text-white mb-2">
              Request Sent Successfully
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The administrator will review your request and email your login details.
            </p>
          </div>
        )}
      </div>

      {/* Progress bar + controls */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-1 bg-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-100"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950/50 backdrop-blur-sm">
          <span className="text-[10px] text-slate-400 tabular-nums">
            {Math.floor(elapsed)}s / {TOTAL_DURATION}s
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={restart}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Restart"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={playing ? pause : play}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Play overlay */}
      {elapsed === 0 && !playing && (
        <button
          onClick={play}
          className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm transition-opacity hover:bg-slate-950/30 z-10"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 animate-pulse-glow">
            <Play size={26} className="text-white ml-1" fill="white" />
          </div>
        </button>
      )}
    </div>
  );
}

function DemoInput({
  icon,
  placeholder,
  value,
  active,
  filled,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  active: boolean;
  filled: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg border transition-all ${
        active
          ? 'border-primary-500 ring-2 ring-primary-500/30'
          : value
            ? 'border-success-400'
            : 'border-slate-200 dark:border-slate-600'
      } bg-white dark:bg-slate-900`}
    >
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <div className="pl-7 pr-2 py-2 text-[11px] text-slate-700 dark:text-slate-300 truncate flex items-center gap-1">
        {value || <span className="text-slate-400">{placeholder}</span>}
        {active && <span className="inline-block w-px h-3 bg-primary-500 animate-pulse" />}
        {filled && !active && <CheckCircle size={11} className="text-success-500 flex-shrink-0" />}
      </div>
    </div>
  );
}
