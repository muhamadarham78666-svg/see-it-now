import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/bank-bulk-resume')({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supplied = request.headers.get('x-bank-bulk-secret') ?? '';
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data: key } = await supabaseAdmin
          .from('bank_bulk_scheduler_keys')
          .select('token')
          .eq('id', 'main')
          .maybeSingle();
        if (!key?.token || supplied !== key.token) return new Response('Unauthorized', { status: 401 });

        const { runBulkJob } = await import('@/lib/bankBulk.server');
        const job = await runBulkJob();
        return Response.json({ ok: true, status: job?.status ?? 'idle' });
      },
    },
  },
});