import { createFileRoute } from '@tanstack/react-router';
import { AskAiPage } from '@/pages/AskAiPage';

export const Route = createFileRoute('/dashboard/ask')({
  head: () => ({
    meta: [
      { title: 'NSAGPT AI — Ask Anything' },
      {
        name: 'description',
        content: 'Ask NSAGPT AI anything about the platform, papers, syllabus or any study question.',
      },
      { property: 'og:title', content: 'NSAGPT AI — Ask Anything' },
      {
        property: 'og:description',
        content: 'Ask NSAGPT AI anything about the platform, papers, syllabus or any study question.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: AskAiPage,
});
