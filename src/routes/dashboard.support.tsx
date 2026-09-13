import { createFileRoute } from '@tanstack/react-router';
import { SupportPage } from '@/pages/SupportPage';

export const Route = createFileRoute('/dashboard/support')({
  staticData: { sitemap: false },
  component: SupportPage,
});
