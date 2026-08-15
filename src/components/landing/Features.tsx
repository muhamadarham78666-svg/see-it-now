import {
  ListChecks,
  AlignLeft,
  FileEdit,
  Languages,
  Globe,
  Shuffle,
  ScanSearch,
  Gauge,
  Hash,
  FileUp,
  PencilLine,
  Archive,
  Newspaper,
  FileDown,
  FileType2,
  Printer,
} from 'lucide-react';

const features = [
  { icon: ListChecks, title: 'AI MCQ Generator', desc: 'Generate multiple-choice questions with customizable options.' },
  { icon: AlignLeft, title: 'Short Question Generator', desc: 'Create concise short questions with expected answers.' },
  { icon: FileEdit, title: 'Long Question Generator', desc: 'Build detailed long questions with answer points.' },
  { icon: Languages, title: 'Urdu Support', desc: 'Full Urdu language support with proper RTL layout.' },
  { icon: Globe, title: 'English Support', desc: 'Generate questions in English with natural language.' },
  { icon: Shuffle, title: 'Mixed Language', desc: 'Combine English and Urdu in a single generation.' },
  { icon: ScanSearch, title: 'Smart Topic Analysis', desc: 'AI identifies and categorizes key topics automatically.' },
  { icon: Gauge, title: 'Difficulty Control', desc: 'Choose easy, medium, hard, or mixed difficulty levels.' },
  { icon: Hash, title: 'Custom Question Count', desc: 'Generate any number of questions with presets or custom input.' },
  { icon: FileUp, title: 'Drag & Drop Upload', desc: 'Easily upload PDF, Word, text, or image files.' },
  { icon: PencilLine, title: 'Question Editing', desc: 'Edit, delete, duplicate, and regenerate any question.' },
  { icon: Archive, title: 'Question Bank', desc: 'Store and organize all your generated questions in one place.' },
  { icon: Newspaper, title: 'Question Paper Builder', desc: 'Build professional exam papers with custom formatting.' },
  { icon: FileDown, title: 'PDF Export', desc: 'Export your question papers as PDF files.' },
  { icon: FileType2, title: 'Word Export', desc: 'Export to Word format for further editing.' },
  { icon: Printer, title: 'Print', desc: 'Print question papers directly from the browser.' },
];

export function Features() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-sm font-medium mb-4">
            Capabilities
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            A complete toolkit for generating questions and building professional exam papers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="card p-5 hover:border-primary-200 dark:hover:border-primary-700/50 transition-all duration-200 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${(i % 4) * 0.08}s` }}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-1.5">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
