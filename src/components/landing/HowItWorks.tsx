import { Upload, Settings2, Sparkles, FileText } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Upload',
    description: 'Upload PDF, Word document, image, text or paste/write study material directly.',
    icon: Upload,
  },
  {
    number: '02',
    title: 'Customize',
    description: 'Select language (English, Urdu, Mixed), question type (MCQ, Short, Long), count, difficulty, and MCQ options.',
    icon: Settings2,
  },
  {
    number: '03',
    title: 'AI Generates',
    description: 'NSAGPT analyzes the content, identifies important topics and generates relevant questions.',
    icon: Sparkles,
  },
  {
    number: '04',
    title: 'Build & Export',
    description: 'Edit questions, create a professional question paper and export or print it.',
    icon: FileText,
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-28 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-4">
            Simple Workflow
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            From study material to professional question paper in four simple steps.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="card p-6 h-full hover:border-primary-200 dark:hover:border-primary-700/50 transition-all duration-200 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/25 group-hover:scale-110 transition-transform">
                      <Icon size={24} />
                    </div>
                    <span className="font-display text-4xl font-bold text-slate-100 dark:text-slate-800 group-hover:text-primary-100 dark:group-hover:text-primary-900/40 transition-colors">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 z-10">
                    <div className="w-full h-full rounded-full border-2 border-dashed border-primary-300 dark:border-primary-700/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
