import { createFileRoute } from '@tanstack/react-router';
import { ContentPage, Section } from '@/components/content/ContentPage';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I get an account?',
    a: 'Press "Contact with administrator" or "Request access" and fill the short form. Our team reviews the request and creates your account, then emails you the login details.',
  },
  {
    q: 'How do subscriptions work?',
    a: 'Choose Silver (Weekly, Rs. 399, 1 user), Gold (3 Months, Rs. 4,999, 3 users) or Diamond (1 Year, Rs. 10,500, 5 users) and submit the request form. Our team contacts you and activates the plan manually. No card details are collected on the website.',
  },
  {
    q: 'Which classes and subjects are supported?',
    a: 'Classes 9 to 12 — English, Urdu, Islamiat, Pakistan Studies, Mathematics, Physics, Chemistry, Biology and Computer Science, following Punjab board style patterns.',
  },
  {
    q: 'Can I upload my own material?',
    a: 'Yes. You can upload PDFs, Word files, text files, spreadsheets and images or scans. Text inside images is read automatically before questions are generated.',
  },
  {
    q: 'Can I make Urdu papers?',
    a: 'Yes. Papers can be fully Urdu, fully English, or mixed, with proper right-to-left layout for Urdu.',
  },
  {
    q: 'Can I edit the questions before printing?',
    a: 'Yes. Every question can be edited, reordered or removed in the preview, and then exported as a printable paper.',
  },
  {
    q: 'Why does it ask to approve my device?',
    a: 'Each plan allows a fixed number of users. When you sign in from a new device, a request is sent for approval so accounts are not shared beyond the plan limit.',
  },
  {
    q: 'What happens when my subscription ends?',
    a: 'AI features stop and you are asked to contact the NSAGPT team. Your saved papers, notes and question bank stay in your account.',
  },
  {
    q: 'I need help with a problem. What should I do?',
    a: 'Open Support in your dashboard. The assistant answers common questions instantly, and you can press "Talk with NSAGPT Team" at any time to reach a person.',
  },
];

export const Route = createFileRoute('/faq')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'NSAGPT FAQ — Accounts, Plans, Papers & Support' },
      {
        name: 'description',
        content:
          'Answers about NSAGPT accounts, subscription plans, supported classes and subjects, uploads, Urdu papers, device approval and support.',
      },
      { property: 'og:title', content: 'NSAGPT Frequently Asked Questions' },
      { property: 'og:description', content: 'Everything about accounts, plans and paper generation.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://nsagpt.org/faq' }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Faq,
});

function Faq() {
  return (
    <ContentPage
      title="Frequently asked questions"
      intro="Short answers to the questions teachers ask us most often."
    >
      {FAQS.map((f) => (
        <Section key={f.q} heading={f.q}>
          <p>{f.a}</p>
        </Section>
      ))}
    </ContentPage>
  );
}
