import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/pages/LandingPage";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "NSAGPT — AI Question Paper Generator for Teachers" },
      { name: "description", content: "Generate exam questions and build board-pattern question papers from your own notes, books or PDFs with AI. Classes 9-12, all subjects." },
      { property: "og:title", content: "NSAGPT — AI Question Paper Generator" },
      { property: "og:description", content: "Turn your notes into exam-ready questions and printable papers in minutes." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nsagpt.org/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://nsagpt.org/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "NSAGPT",
          url: "https://nsagpt.org/",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          description:
            "AI question and paper generator for teachers: build board-pattern papers, solve physics and math problems, and create notes from any file.",
          image: "https://nsagpt.org/nsagpt-icon.png",
          inLanguage: ["en", "ur"],
          publisher: {
            "@type": "Organization",
            name: "NSAGPT",
            url: "https://nsagpt.org/",
            logo: {
              "@type": "ImageObject",
              url: "https://nsagpt.org/nsagpt-icon.png",
              width: 512,
              height: 512,
            },
          },
        }),
      },
    ],
  }),
  component: LandingPage,
});
