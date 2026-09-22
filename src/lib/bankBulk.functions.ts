import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** Owner/admin bulk filler for the offline question bank. */

type Ctx = { supabase: any; userId: string };

async function assertStaff(context: Ctx) {
  const results = await Promise.all(
    (['owner', 'admin', 'editor'] as const).map((role) =>
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: role }),
    ),
  );
  if (!results.some((r: any) => r.data)) throw new Error('Forbidden');
}

const scopeSchema = z.object({
  classLevel: z.string().trim().default(''),
  book: z.string().trim().default(''),
  targets: z
    .object({
      mcq: z.number().int().min(0).max(300).default(60),
      short: z.number().int().min(0).max(300).default(30),
      long: z.number().int().min(0).max(120).default(12),
    })
    .default({ mcq: 60, short: 30, long: 12 }),
});

/** How much of the scope is already covered. */
export const bankBulkProgressFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => scopeSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { bulkProgress } = await import('./bankBulk.server');
    return await bulkProgress(data);
  });

/** One batch: fills the next chapter that is behind its target. */
export const bankBulkStepFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => scopeSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { bulkStep } = await import('./bankBulk.server');
    return await bulkStep(context as Ctx, data);
  });
