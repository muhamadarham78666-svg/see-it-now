import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — NSAGPT" },
      { name: "description", content: "Sign in to NSAGPT to generate questions and build question papers." },
      { property: "og:title", content: "Sign in — NSAGPT" },
      { property: "og:description", content: "Access your NSAGPT teacher dashboard." },
    ],
  }),
  component: LoginPage,
});
