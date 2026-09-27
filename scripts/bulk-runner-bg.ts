/**
 * Long-running background bulk fill runner.
 * Continuously checks if free Gemini quota is available, runs bulk fill when it is,
 * sleeps when it isn't. Designed to run via nohup in background.
 * 
 * Usage: nohup bun run scripts/bulk-runner-bg.ts > /tmp/bulk-run.log 2>&1 &
 */
import { runBulkJob, latestBulkJob } from '@/lib/bankBulk.server';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function resetToRunning(jobId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const supabase = supabaseAdmin as any;
  const { error } = await supabase
    .from('bank_bulk_jobs')
    .update({ status: 'running', next_retry_at: null, lease_until: null, last_message: 'Background bulk run.' })
    .eq('id', jobId);
  if (error) console.error('[reset]', error.message);
}

async function hasQuota(): Promise<boolean> {
  const key = process.env['zain'];
  if (!key) return false;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Reply "OK" only.' }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function main() {
  const START = Date.now();
  const MAX_RUNTIME_MS = 8 * 60 * 60 * 1000; // 8 hours max
  let totalSaved = 0;
  let initialQ = 0;
  let checkCount = 0;

  console.log(`[START] ${new Date().toISOString()} — Background bulk runner`);

  const job0 = await latestBulkJob();
  if (!job0) {
    console.error('No bulk job found. Start one from admin first.');
    process.exit(1);
  }
  initialQ = job0.progress.questions;
  console.log(`[INIT] status=${job0.status} q=${job0.progress.questions} miss=${job0.progress.missing}`);

  while (Date.now() - START < MAX_RUNTIME_MS) {
    checkCount++;
    
    // Check if quota is available
    const quota = await hasQuota();
    if (!quota) {
      const elapsed = Math.round((Date.now() - START) / 60000);
      console.log(`[${checkCount}] ${elapsed}min — no quota, sleeping 5min`);
      await sleep(300_000); // 5 min
      continue;
    }

    console.log(`[${checkCount}] Quota available! Resetting job and running...`);
    const job = await latestBulkJob();
    if (!job || job.status === 'completed') {
      console.log('Job completed or missing. Done!');
      break;
    }
    if (job.status === 'waiting' || job.status === 'blocked' || job.status === 'paused') {
      await resetToRunning(job.id);
    }

    // Run for up to 9 minutes (540s), then check quota again
    const deadline = Date.now() + 540_000;
    let iterations = 0;
    while (Date.now() < deadline) {
      iterations++;
      try {
        const result = await runBulkJob();
        if (!result) break;
        
        const saved = result.progress.questions - initialQ - totalSaved;
        totalSaved = result.progress.questions - initialQ;
        const elapsed = Math.round((Date.now() - START) / 1000);
        console.log(
          `[run ${iterations}] ${elapsed}s | ${result.status} | ` +
          `ch=${result.progress.chaptersDone}/${result.progress.chapters} | ` +
          `q=${result.progress.questions} (+${saved}) | ` +
          `miss=${result.progress.missing} | ${result.lastChapter}`
        );

        if (result.status === 'completed') {
          console.log('=== ALL CHAPTERS DONE! ===');
          process.exit(0);
        }
        if (result.status === 'blocked') {
          console.log('=== BLOCKED. Sleeping 5 min. ===');
          await sleep(300_000);
          break;
        }
        if (result.status === 'waiting') {
          console.log('=== Quota exhausted mid-run. Sleeping 5 min. ===');
          await sleep(300_000);
          break;
        }
        if (result.status === 'paused') {
          console.log('=== Paused. Stopping. ===');
          process.exit(0);
        }
        await sleep(500);
      } catch (e: any) {
        console.error(`[error] ${e?.message ?? e}`);
        await sleep(60_000);
        break;
      }
    }
  }

  const finalJob = await latestBulkJob();
  if (finalJob) {
    console.log(
      `\n[FINAL] ${finalJob.status} | ` +
      `ch=${finalJob.progress.chaptersDone}/${finalJob.progress.chapters} | ` +
      `q=${finalJob.progress.questions} (+${finalJob.progress.questions - initialQ}) | ` +
      `miss=${finalJob.progress.missing}`
    );
  }
  console.log(`[DONE] Total saved this session: ${totalSaved}`);
}

main().catch((e) => {
  console.error('Fatal:', e?.message ?? e);
  process.exit(1);
});
