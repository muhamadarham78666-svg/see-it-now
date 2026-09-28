/** Usage: bun run scripts/bank-insert.ts <file.json>
 * JSON: [{ c:"9th", b:"Physics", ch:"Magnetism", lang?:"english",
 *   m:[[q,[a,b,c,d],"A"]], s:[[q,ans]], l:[[q,[points]]] }]
 */
import { readFileSync } from 'fs';
import { fingerprint } from '@/lib/bank.server';

const file = process.argv[2];
const chapters = JSON.parse(readFileSync(file, 'utf8')) as any[];
const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
for (const x of chapters) {
  const C = { class_level: x.c, book: x.b, chapter: x.ch };
  const base = (t: string) => ({
    ...C, topic: x.ch, category: '', language: x.lang ?? 'english', difficulty: 'medium',
    question_text: t, explanation: '', is_active: true,
    fingerprint: fingerprint({ ...C, question_text: t }),
  });
  const rows = [
    ...(x.m ?? []).map(([t, o, a]: any) => ({ ...base(t), question_type: 'mcq', marks: 1, options: o, correct_answer: a })),
    ...(x.s ?? []).map(([t, a]: any) => ({ ...base(t), question_type: 'short', marks: 2, expected_answer: a })),
    ...(x.l ?? []).map(([t, p]: any) => ({ ...base(t), question_type: 'long', marks: 8, answer_points: p })),
  ];
  const { data, error } = await (supabaseAdmin as any)
    .from('bank_questions').upsert(rows, { onConflict: 'fingerprint', ignoreDuplicates: true }).select('id');
  console.log(`${x.c} ${x.b} ${x.ch}:`, error?.message ?? `saved ${data.length}/${rows.length}`);
}
