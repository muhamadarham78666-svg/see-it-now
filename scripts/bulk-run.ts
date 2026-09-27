/**
 * Standalone bulk fill runner — run from project root with `bun run scripts/bulk-run.ts`.
 * Imports server modules directly and runs runBulkJob in a loop.
 * Stops when the job completes, blocks, or the script times out (~50 min).
 */
import { runBulkJob, latestBulkJob } from '@/lib/bankBulk.server';

async function resetToRunning(jobId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const supabase = supabaseAdmin as any;
  const { error } = await supabase
    .from('bank_bulk_jobs')
    .update({ status: 'running', next_retry_at: null, lease_until: null, last_message: 'Manual bulk run started.' })
    .eq('id', jobId);
  if (error) console.error('reset error:', error.message);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const startTime = Date.now();
  const MAX_RUNTIME_MS = 50 * 60 * 1000; // 50 minutes max
  let iterations = 0;

  console.log('=== Bulk Fill Runner ===');

  let job = await latestBulkJob();
  if (!job) {
    console.error('No bulk job found. Please start one from admin first.');
    process.exit(1);
  }
  console.log(
    `Initial: status=${job.status} chapters=${job.progress.chaptersDone}/${job.progress.chapters} ` +
    `questions=${job.progress.questions} missing=${job.progress.missing}`
  );

  if (job.status === 'waiting' || job.status === 'blocked') {
    console.log(`Resetting from ${job.status} to running...`);
    await resetToRunning(job.id);
  }

  while (Date.now() - startTime < MAX_RUNTIME_MS) {
    iterations++;
    job = await runBulkJob();

    if (!job) {
      console.log(`[${iterations}] No active job. Done.`);
      break;
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(
      `[${iterations}] ${elapsed}s | ${job.status} | ` +
      `ch=${job.progress.chaptersDone}/${job.progress.chapters} | ` +
      `q=${job.progress.questions} | miss=${job.progress.missing} | ` +
      `${job.lastChapter}`
    );

    if (job.status === 'completed') {
      console.log('=== COMPLETED! All chapters reached targets. ===');
      break;
    }
    if (job.status === 'blocked') {
      console.log('=== BLOCKED: Free AI provider issue. Stopping. ===');
      break;
    }
    if (job.status === 'paused') {
      console.log('Job paused. Stopping.');
      break;
    }

    if (job.status === 'waiting') {
      const waitMs = job.nextRetryAt ? new Date(job.nextRetryAt).getTime() - Date.now() : 60000;
      if (waitMs > 5_000 && waitMs < 300_000) {
        console.log(`  Free quota cooling — waiting ${Math.round(waitMs / 1000)}s...`);
        await sleep(Math.min(waitMs + 3000, 300_000));
        await resetToRunning(job.id);
        continue;
      } else if (waitMs >= 300_000) {
        console.log(`  Wait too long (${Math.round(waitMs / 1000)}s). Stopping runner.`);
        break;
      }
      await resetToRunning(job.id);
      continue;
    }

    // running — brief pause then continue
    await sleep(300);
  }

  const finalJob = await latestBulkJob();
  if (finalJob) {
    console.log(
      `\nFinal: ${finalJob.status} | ch=${finalJob.progress.chaptersDone}/${finalJob.progress.chapters} | ` +
      `q=${finalJob.progress.questions} | miss=${finalJob.progress.missing}`
    );
  }
  console.log(`Runner done — ${iterations} iterations.`);
}

main().catch((e) => {
  console.error('Fatal:', e?.message ?? e);
  process.exit(1);
});
