import { createFileRoute } from "@tanstack/react-router";
import { QuestionBankPage } from "@/pages/QuestionBankPage";

export const Route = createFileRoute("/dashboard/bank")({
  head: () => ({
    meta: [
      { title: "Question Bank — NSAGPT" },
      { name: "description", content: "Question Bank in your NSAGPT dashboard." },
      { property: "og:title", content: "Question Bank — NSAGPT" },
      { property: "og:description", content: "Question Bank in your NSAGPT dashboard." },
    ],
  }),
  component: QuestionBankPage,
});
