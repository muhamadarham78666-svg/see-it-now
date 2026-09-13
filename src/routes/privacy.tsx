import { createFileRoute } from '@tanstack/react-router';
import { ContentPage, Section } from '@/components/content/ContentPage';

export const Route = createFileRoute('/privacy')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'Privacy Policy — NSAGPT' },
      {
        name: 'description',
        content:
          'What NSAGPT stores, how uploaded material and AI requests are handled, who can see your data, and how to have your account removed.',
      },
      { property: 'og:title', content: 'NSAGPT Privacy Policy' },
      { property: 'og:description', content: 'What we store and how your material is handled.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://nsagpt.org/privacy' }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <ContentPage
      title="Privacy Policy"
      intro="This page describes only what the platform actually does today."
    >
      <Section heading="What we store">
        <ul className="list-disc pl-5 space-y-2">
          <li>Your name, email and optional board/class preference for your profile.</li>
          <li>The questions, papers, notes and solutions you create, linked to your account.</li>
          <li>Access and subscription requests you submit, including the phone number you provide.</li>
          <li>Sign-in device information (browser, operating system, IP address) used for device approval.</li>
          <li>A count of your AI requests, used only to apply fair-use limits.</li>
          <li>Support conversations, including messages answered by the assistant or by our team.</li>
        </ul>
      </Section>

      <Section heading="Uploaded material">
        <p>
          Files you upload are sent for processing so questions, notes or solutions can be produced.
          The generated result is saved to your account. We do not sell your material and do not use
          it to advertise to you.
        </p>
      </Section>

      <Section heading="Who can see your data">
        <p>
          Your papers, notes, question bank and history are visible only to you. The NSAGPT
          administrators can see account details, requests, subscription status, devices and support
          conversations in order to run the service and help you.
        </p>
      </Section>

      <Section heading="Services we rely on">
        <p>
          We use a hosted database and authentication service to store accounts and content, an AI
          service to generate questions, notes, solutions and support answers, and an email service
          to send account, request and subscription notifications.
        </p>
      </Section>

      <Section heading="Email">
        <p>
          We email you about access requests, account creation, subscription activation, device
          approval and support replies. We do not send marketing newsletters.
        </p>
      </Section>

      <Section heading="Payments">
        <p>
          The website does not collect card or bank details. Subscription requests only contain the
          name, email, phone number and optional message you enter.
        </p>
      </Section>

      <Section heading="Removal of your data">
        <p>
          You can ask us to delete your account and its content through the contact form or the
          Support page in your dashboard. Deleting the account removes your profile and your saved
          content.
        </p>
      </Section>
    </ContentPage>
  );
}
