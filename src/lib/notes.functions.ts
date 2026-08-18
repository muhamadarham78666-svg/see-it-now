import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requestNote } from "./notes.server";

const inputSchema = z.object({
  prompt: z.string().default(""),
  language: z.string().default("english"),
  style: z.string().default("structured"),
  subject: z.string().nullable().optional(),
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
});

export const generateNoteFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => requestNote(data));
