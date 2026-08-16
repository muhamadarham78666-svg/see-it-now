import { createFileRoute } from "@tanstack/react-router";
import { SolverPage } from "@/pages/SolverPage";

export const Route = createFileRoute("/dashboard/solver")({
  head: () => ({
    meta: [
      { title: "Physics / Math Solver — NSAGPT" },
      {
        name: "description",
        content: "Solve physics numericals and maths problems step by step with AI.",
      },
      { property: "og:title", content: "Physics / Math Solver — NSAGPT" },
      {
        property: "og:description",
        content: "Solve physics numericals and maths problems step by step with AI.",
      },
    ],
  }),
  component: SolverPage,
});
