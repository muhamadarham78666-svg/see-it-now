import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/pages/DashboardPage";

export const Route = createFileRoute("/dashboard/index")({
  head: () => ({
    meta: [
      { title: "Dashboard — NSAGPT" },
      { name: "description", content: "Dashboard in your NSAGPT dashboard." },
      { property: "og:title", content: "Dashboard — NSAGPT" },
      { property: "og:description", content: "Dashboard in your NSAGPT dashboard." },
    ],
  }),
  component: DashboardPage,
});
