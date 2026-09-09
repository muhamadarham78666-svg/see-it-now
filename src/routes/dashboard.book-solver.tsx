import { createFileRoute } from '@tanstack/react-router';
import { BookSolverPage } from '@/pages/BookSolverPage';

export const Route = createFileRoute('/dashboard/book-solver')({
  head: () => ({
    meta: [
      { title: 'Book Solver — NSAGPT' },
      {
        name: 'description',
        content: 'Solve exercise questions of any 9th to 12th class book with step-by-step answers and diagrams.',
      },
      { property: 'og:title', content: 'Book Solver — NSAGPT' },
      {
        property: 'og:description',
        content: 'Solve exercise questions of any 9th to 12th class book with step-by-step answers and diagrams.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: BookSolverPage,
});
