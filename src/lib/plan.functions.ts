import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requestPaperPlan } from "./plan.server";

const inputSchema = z.object({
  instructions: z.string().default(""),
  classGroup: z.string().nullable().optional(),
  bookName: z.string().nullable().optional(),
  rangeLabel: z.string().nullable().optional(),
  chapters: z.array(z.string()).nullable().optional(),
  patternBrief: z.string().nullable().optional(),
  language: z.string().default("english"),
  counts: z.object({ mcq: z.number(), short: z.number(), long: z.number() }),
  uiLanguage: z.string().max(60).nullable().optional(),
});

export const suggestPaperPlanFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => requestPaperPlan(data));
