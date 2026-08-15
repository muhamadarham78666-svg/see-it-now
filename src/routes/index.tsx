import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/pages/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NSAGPT — AI Question Paper Generator for Teachers" },
      { name: "description", content: "Generate exam questions and build question papers from your own notes with AI. Built for schools and teachers." },
      { property: "og:title", content: "NSAGPT — AI Question Paper Generator" },
      { property: "og:description", content: "Turn your notes into exam-ready questions and printable papers in minutes." },
    ],
  }),
  component: LandingPage,
});
