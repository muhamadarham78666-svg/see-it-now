import { createFileRoute } from '@tanstack/react-router';
import { ContentPage, Section } from '@/components/content/ContentPage';

export const Route = createFileRoute('/terms')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'Terms of Service — NSAGPT' },
      {
        name: 'description',
        content:
          'The rules for using NSAGPT: account access, subscriptions, fair use of AI features, content ownership and account suspension.',
      },
      { property: 'og:title', content: 'NSAGPT Terms of Service' },
      { property: 'og:description', content: 'Rules for using NSAGPT accounts and AI features.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://nsagpt.org/terms' }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <ContentPage
      title="Terms of Service"
      intro="By using NSAGPT you agree to the points below. These terms describe how the platform is provided today."
    >
      <Section heading="1. Accounts">
        <p>
          Accounts are created by the NSAGPT team after an access or subscription request. You are
          responsible for keeping your password private and for everything done with your account.
        </p>
      </Section>

      <Section heading="2. Subscriptions and activation">
        <p>
          Plans are activated manually by our team after we contact you. The website does not collect
          card details and does not process online payments. Each plan allows a fixed number of
          users; sign-ins from new devices may require approval.
        </p>
      </Section>

      <Section heading="3. Fair use of AI features">
        <p>
          AI generation is limited per account to keep the service available for everyone. Automated
          scripts, resale of access, or sharing one account beyond your plan limit may lead to
          suspension.
        </p>
      </Section>

      <Section heading="4. Your content">
        <p>
          Material you upload and the papers, notes and solutions you create stay yours. We process
          them only to produce your requested output and to show your own history inside your
          account. Do not upload material you are not allowed to use.
        </p>
      </Section>

      <Section heading="5. Accuracy">
        <p>
          AI output can contain mistakes. Always review generated questions, marks and solutions
          before using them in a class or exam. NSAGPT is a teaching aid, not a replacement for the
          teacher’s judgement.
        </p>
      </Section>

      <Section heading="6. Availability and changes">
        <p>
          Features may change or be temporarily unavailable during maintenance or when an external
          service fails. We may update these terms; the current version always appears on this page.
        </p>
      </Section>

      <Section heading="7. Suspension">
        <p>
          Accounts that abuse the platform, share access beyond plan limits, or upload unlawful
          material may be suspended or removed.
        </p>
      </Section>

      <Section heading="8. Contact">
        <p>
          For anything related to these terms, use the contact form on this website or the Support
          page in your dashboard.
        </p>
      </Section>
    </ContentPage>
  );
}
