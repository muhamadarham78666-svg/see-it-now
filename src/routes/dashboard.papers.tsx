import { createFileRoute } from "@tanstack/react-router";
import { PaperBuilderPage } from "@/pages/PaperBuilderPage";

export const Route = createFileRoute("/dashboard/papers")({
  head: () => ({
    meta: [
      { title: "Question Papers — NSAGPT" },
      { name: "description", content: "Question Papers in your NSAGPT dashboard." },
      { property: "og:title", content: "Question Papers — NSAGPT" },
      { property: "og:description", content: "Question Papers in your NSAGPT dashboard." },
    ],
  }),
  component: PaperBuilderPage,
});
