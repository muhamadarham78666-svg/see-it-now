import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "@/pages/HistoryPage";

export const Route = createFileRoute("/dashboard/history")({
  head: () => ({
    meta: [
      { title: "History — NSAGPT" },
      { name: "description", content: "History in your NSAGPT dashboard." },
      { property: "og:title", content: "History — NSAGPT" },
      { property: "og:description", content: "History in your NSAGPT dashboard." },
    ],
  }),
  component: HistoryPage,
});
