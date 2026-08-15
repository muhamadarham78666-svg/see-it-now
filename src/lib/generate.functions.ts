import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requestQuestions } from "./generate.server";

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
  }),
});

export const generateQuestionsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const questions = await requestQuestions(data.text, data.attachments, data.settings);
    return { questions };
  });
