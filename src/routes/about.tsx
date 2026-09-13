import { createFileRoute } from '@tanstack/react-router';
import { ContentPage, Section } from '@/components/content/ContentPage';

export const Route = createFileRoute('/about')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'About NSAGPT — AI Paper & Notes Platform for Teachers' },
      {
        name: 'description',
        content:
          'NSAGPT helps Pakistani teachers create board-pattern question papers, notes and worked solutions from their own material in minutes.',
      },
      { property: 'og:title', content: 'About NSAGPT' },
      { property: 'og:description', content: 'Why NSAGPT exists and who builds it.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://nsagpt.org/about' }],
  }),
  component: About,
});

function About() {
  return (
    <ContentPage
      title="About NSAGPT"
      intro="NSAGPT is an AI teaching assistant built for Pakistani schools, colleges and academies. It turns your own notes, textbooks and scans into exam-ready papers, notes and step-by-step solutions."
    >
      <Section heading="What we do">
        <ul className="list-disc pl-5 space-y-2">
          <li>Board-pattern question papers for Classes 9 to 12, all major subjects.</li>
          <li>MCQ, short and long questions in English or Urdu, with marks and sections.</li>
          <li>Step-by-step Physics and Math solutions, and a Book Solver for exercise questions.</li>
          <li>AI notes, a personal question bank, paper history and printable PDF export.</li>
        </ul>
      </Section>

      <Section heading="Who it is for">
        <p>
          Teachers, academy owners, tuition centres and heads of department who prepare tests every
          week and want the same quality in a fraction of the time.
        </p>
      </Section>

      <Section heading="How access works">
        <p>
          NSAGPT is invite-based. You request access or a subscription plan, our team contacts you,
          and your account is activated manually — there is no online card payment.
        </p>
      </Section>

      <Section heading="Who builds NSAGPT">
        <p>NSAGPT is developed and maintained by ZK SOLUTIONS.</p>
      </Section>
    </ContentPage>
  );
}
