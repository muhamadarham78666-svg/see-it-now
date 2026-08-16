import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
    subjectArea: z.enum(["physics", "math"]),
    language: z.string(),
    detail: z.enum(["concise", "detailed"]),
    topic: z.string().nullable().optional(),
    problemCount: z.number().nullable().optional(),
  }),
});

export const solveProblemsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const raw = await requestSolutions(data.text, data.attachments, data.settings);
    return { problems: normalizeSolutions(raw) };
  });
