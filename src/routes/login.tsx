import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Sign in — NSAGPT" },
      { name: "description", content: "Sign in to NSAGPT to generate questions and build question papers, or request access from the administrator." },
      { property: "og:title", content: "Sign in — NSAGPT" },
      { property: "og:description", content: "Access your NSAGPT teacher dashboard." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nsagpt.org/login" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nsagpt.org/login" }],
  }),
  component: LoginPage,
});
