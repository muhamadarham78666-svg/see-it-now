import { Clock, BookOpen, Languages, Pencil, Newspaper, Layers, Zap } from 'lucide-react';

const benefits = [
  { icon: Clock, title: 'Saves Teacher Preparation Time', desc: 'Generate questions in seconds instead of hours of manual work.' },
  { icon: BookOpen, title: 'Converts Study Material Into Questions', desc: 'Turn any chapter, PDF, or notes into structured questions.' },
  { icon: Newspaper, title: 'Helps Prepare Tests and Exams', desc: 'Build complete exam papers ready for printing or export.' },
  { icon: Languages, title: 'Supports Urdu and English', desc: 'Work in either language or mix both in a single generation.' },
  { icon: Pencil, title: 'Allows Manual Editing', desc: 'Fine-tune every question, option, and answer to perfection.' },
  { icon: Newspaper, title: 'Creates Professional Papers', desc: 'Produce clean, formatted question papers with institution details.' },
  { icon: Layers, title: 'Organizes Generated Questions', desc: 'Keep all questions in a searchable, filterable question bank.' },
  { icon: Zap, title: 'Simple and Fast Workflow', desc: 'From upload to export in a few clicks — no technical skills needed.' },
];

export function WhyNSAGPT() {
  return (
    <section className="py-20 lg:py-28 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 text-sm font-medium mb-4">
            Benefits
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Why NSAGPT
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Practical benefits for educators who need quality questions fast.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="group p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 border border-slate-100 dark:border-slate-700/40 hover:border-primary-200 dark:hover:border-primary-700/50 transition-all duration-200 hover:shadow-md animate-fade-in-up"
                style={{ animationDelay: `${(i % 4) * 0.08}s` }}
              >
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700/50 flex items-center justify-center text-primary-500 dark:text-primary-400 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Icon size={20} />
                </div>
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-2 leading-snug">
                  {b.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
