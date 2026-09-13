import { createFileRoute } from '@tanstack/react-router';
import { ContentPage, Section } from '@/components/content/ContentPage';
import { AccessRequestForm } from '@/components/AccessRequestForm';

export const Route = createFileRoute('/contact')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'Contact NSAGPT — Request Access or Get Help' },
      {
        name: 'description',
        content:
          'Send a message to the NSAGPT team to request an account, ask about subscription plans, or get help with papers, notes and solutions.',
      },
      { property: 'og:title', content: 'Contact the NSAGPT team' },
      { property: 'og:description', content: 'Request an account or ask us anything about NSAGPT.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://nsagpt.org/contact' }],
  }),
  component: Contact,
});

function Contact() {
  return (
    <ContentPage
      title="Contact us"
      intro="Fill the form below and our team will get back to you by email. Use it to request an account, ask about a subscription plan, or report a problem."
    >
      <AccessRequestForm />

      <Section heading="Already have an account?">
        <p>
          Sign in and open <strong>Support</strong> in your dashboard. The assistant answers common
          questions instantly, and you can press “Talk with NSAGPT Team” to reach a person in the same
          conversation.
        </p>
      </Section>
    </ContentPage>
  );
}
