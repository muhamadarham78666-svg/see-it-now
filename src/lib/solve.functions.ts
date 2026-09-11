import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeSolutions, requestSolutions } from "./solve.server";

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
    subjectArea: z.enum(["physics", "math", "book"]),
    language: z.string(),
    detail: z.enum(["concise", "detailed"]),
    topic: z.string().nullable().optional(),
    problemCount: z.number().nullable().optional(),
    subjectName: z.string().nullable().optional(),
    classGroup: z.string().nullable().optional(),
    chapters: z.array(z.string()).nullable().optional(),
    wantDiagrams: z.boolean().nullable().optional(),

  }),
});

export const solveProblemsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { requireActiveSubscription } = await import('./subscription.server');
    await requireActiveSubscription(context);
    const raw = await requestSolutions(data.text, data.attachments, data.settings);
    return { problems: normalizeSolutions(raw) };
  });
