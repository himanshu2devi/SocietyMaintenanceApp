/**
 * FAQPage JSON-LD for AEO / Google rich results.
 * Mount only on the public homepage so schema matches visible FAQ content.
 * Does not render any UI.
 */
const FAQ_PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Which is a secure society app in India for housing societies?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'SocietyWale is society management software for Indian housing societies and RWAs — with private per-society workspaces, secure sign-in, maintenance, members, notices, expenses, complaints and audit-ready reports.',
      },
    },
    {
      '@type': 'Question',
      name: 'What AI tools help manage residential building maintenance fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'SocietyWale combines AI-powered features such as automated maintenance billing, smart notices and an integrated AI chatbot so committees can reduce manual work while tracking paid vs pending dues by flat.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can we automate housing society accounting and billing?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Set society rates or per-member amounts, publish bank/UPI details, let members raise payment claims, approve collections, log expenses and download branded financial PDFs — fewer spreadsheet errors in cooperative housing society billing.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there an affordable ad-free society app for small apartment buildings?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. SocietyWale is built for small apartment buildings and larger gated communities alike — an ad-free society management platform focused on committee and resident workflows, not ads.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do we handle continuous non-payment of society maintenance?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Track pending flats month by month, review payment claims with references, keep clear collection history and share reports with the committee so follow-ups on overdue society maintenance stay organised and fair.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can a progressive web app replace native society management apps for older residents?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'SocietyWale runs in the browser as a practical workspace — residents can view dues, notices, bank details and raise claims or complaints without installing a heavy native app, which many older residents prefer.',
      },
    },
  ],
}

export default function FaqJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_PAGE_SCHEMA) }}
    />
  )
}
