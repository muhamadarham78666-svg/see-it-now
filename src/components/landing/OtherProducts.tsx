import { Building2, ScanLine, ArrowRight, CheckCircle2 } from 'lucide-react';

const products = [
  {
    name: 'NSAGPT ERP',
    tag: 'For schools & academies',
    icon: Building2,
    description:
      'A complete school and academy management system — admissions, attendance, fees, timetables, results and parent communication in one dashboard.',
    points: ['Students, staff & fee management', 'Automated result cards', 'Parent & teacher portals'],
  },
  {
    name: 'NSAGPT SCANNER',
    tag: 'For paper checking',
    icon: ScanLine,
    description:
      'Check papers online without saving or uploading files. Point, scan and get live feedback with instant marking — no drag & drop needed.',
    points: ['Live checking feedback', 'No file saving required', 'Instant marks & mistakes summary'],
  },
];

export function OtherProducts() {
  return (
    <section id="ecosystem" className="py-20 lg:py-28 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            More from the NSAGPT family
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            NSAGPT is part of a wider toolkit built for teachers and institutions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {products.map((p) => (
            <article key={p.name} className="glass-card p-8 flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white mb-5 shadow-lg shadow-primary-500/20">
                <p.icon size={26} />
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
                {p.tag}
              </span>
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1 mb-3">
                {p.name}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-5">{p.description}</p>
              <ul className="space-y-2 mb-6">
                {p.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-success-500 mt-0.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
              <a href="#contact" className="btn-secondary mt-auto self-start">
                Ask the administrator
                <ArrowRight size={16} />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
