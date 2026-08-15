import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/SettingsPage";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NSAGPT" },
      { name: "description", content: "Settings in your NSAGPT dashboard." },
      { property: "og:title", content: "Settings — NSAGPT" },
      { property: "og:description", content: "Settings in your NSAGPT dashboard." },
    ],
  }),
  component: SettingsPage,
});
