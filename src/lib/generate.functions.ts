import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeQuestions, requestQuestions } from "./generate.server";

const inputSchema = z.object({
  text: z.string().default(""),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        mime: z.string(),
        dataUrl: z.string().nullable().optional(),
        text: z.string().nullable().optional(),
      }),
    )
    .default([]),
  settings: z.object({
    language: z.string(),
    questionType: z.string(),
    questionCount: z.number(),
    difficulty: z.string(),
    mcqOptionsCount: z.number(),
    typeCounts: z
      .object({ mcq: z.number(), short: z.number(), long: z.number() })
      .nullable()
      .optional(),
    subject: z.string().nullable().optional(),
    chapter: z.string().nullable().optional(),
    instructions: z.string().nullable().optional(),
    classGroup: z.string().nullable().optional(),
    bookName: z.string().nullable().optional(),
    rangeLabel: z.string().nullable().optional(),
    chapters: z.array(z.string()).nullable().optional(),
    patternBrief: z.string().nullable().optional(),
    wantDiagrams: z.boolean().nullable().optional(),
    longParts: z.boolean().nullable().optional(),
    attempts: z
      .object({ mcq: z.number(), short: z.number(), long: z.number() })
      .nullable()
      .optional(),
    composition: z.array(z.string()).nullable().optional(),
    translation: z.string().nullable().optional(),
    statements: z.boolean().nullable().optional(),
    forceUrdu: z.boolean().nullable().optional(),
  }),
});


export const generateQuestionsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { requireActiveSubscription } = await import('./subscription.server');
    await requireActiveSubscription(context);
    const raw = await requestQuestions(data.text, data.attachments, data.settings);
    return { questions: normalizeQuestions(raw) };
  });
