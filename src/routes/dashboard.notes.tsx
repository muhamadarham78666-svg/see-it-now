import { createFileRoute } from '@tanstack/react-router';
import { NotesPage } from '@/pages/NotesPage';

export const Route = createFileRoute('/dashboard/notes')({
  head: () => ({
    meta: [
      { title: 'Notes — NSAGPT' },
      { name: 'description', content: 'Write and manage private study notes in NSAGPT.' },
      { property: 'og:title', content: 'Notes — NSAGPT' },
      { property: 'og:description', content: 'Write and manage private study notes in NSAGPT.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: NotesPage,
});