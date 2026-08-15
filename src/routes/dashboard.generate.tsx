import { createFileRoute } from "@tanstack/react-router";
import { GeneratePage } from "@/pages/GeneratePage";

export const Route = createFileRoute("/dashboard/generate")({
  head: () => ({
    meta: [
      { title: "Generate Questions — NSAGPT" },
      { name: "description", content: "Generate Questions in your NSAGPT dashboard." },
      { property: "og:title", content: "Generate Questions — NSAGPT" },
      { property: "og:description", content: "Generate Questions in your NSAGPT dashboard." },
    ],
  }),
  component: GeneratePage,
});
