import type { Metadata } from 'next'
import { LandingNav } from '@/components/home/nav'
import { LandingFooter } from '@/components/home/footer'

export const metadata: Metadata = {
  title: 'Privacy Policy — CanaryGate',
  description:
    'How CanaryGate collects, uses, and protects your personal data, in compliance with the LGPD (Law No. 13.709/2018).',
  alternates: {
    canonical: '/privacy'
  },
  openGraph: {
    type: 'website',
    url: '/privacy',
    siteName: 'CanaryGate',
    locale: 'en_US',
    title: 'Privacy Policy — CanaryGate',
    description:
      'How CanaryGate collects, uses, and protects your personal data, in compliance with the LGPD (Law No. 13.709/2018).'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — CanaryGate',
    description:
      'How CanaryGate collects, uses, and protects your personal data, in compliance with the LGPD (Law No. 13.709/2018).'
  },
  robots: {
    index: true,
    follow: true
  }
}

export default function PrivacyPage() {
  return (
    <main className="bg-background text-cg-neutral-100">
      <LandingNav />

      <div className="mx-auto max-w-3xl px-4 pt-32 pb-24 sm:px-8">
        <div className="border-cg-bg-100 mb-12 border-b pb-8">
          <h1 className="text-cg-neutral-100 text-3xl font-bold">
            Privacy Policy
          </h1>
          <p className="text-cg-neutral-500 mt-3 text-sm">
            Version 1.0 &mdash; Effective date: August 18, 2026
          </p>
          <p className="text-cg-neutral-400 mt-3 text-sm leading-relaxed">
            This Policy describes how we process the personal data of users of
            the CanaryGate platform, in compliance with the{' '}
            <span className="text-cg-neutral-300">
              Brazilian General Data Protection Law (Lei Geral de Proteção de
              Dados — Law No. 13.709/2018, LGPD)
            </span>
            , the Brazilian Civil Rights Framework for the Internet (Marco
            Civil da Internet — Law No. 12.965/2014), and other applicable
            legislation.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              1. Controller Identification
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                The controller of the personal data processed through this
                Service is:
              </p>
              <ul className="border-cg-bg-100 space-y-1.5 border-l pl-4">
                <li>
                  <span className="text-cg-neutral-100 font-medium">Name:</span>{' '}
                  Rafael Castilho e Borges
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">CNPJ:</span>{' '}
                  Not applicable (individual)
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    E-mail:
                  </span>{' '}
                  <a
                    href="mailto:rcborges98@gmail.com"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    rcborges98@gmail.com
                  </a>
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    Service:
                  </span>{' '}
                  CanaryGate — SaaS platform for feature flag management
                  (canarygate.io)
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              2. Data Protection Officer (DPO)
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Under Article 41 of the LGPD, the Data Protection Officer
                responsible for the processing of personal data is:
              </p>
              <ul className="border-cg-bg-100 space-y-1.5 border-l pl-4">
                <li>
                  <span className="text-cg-neutral-100 font-medium">Name:</span>{' '}
                  Rafael Castilho e Borges
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    E-mail:
                  </span>{' '}
                  <a
                    href="mailto:rcborges98@gmail.com"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    rcborges98@gmail.com
                  </a>
                </li>
              </ul>
              <p>
                The Data Protection Officer is the channel of communication
                between CanaryGate, the data subjects, and the National Data
                Protection Authority (ANPD).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              3. Personal Data We Collect
            </h2>
            <div className="text-cg-neutral-300 space-y-4 text-sm leading-relaxed">
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  3.1 Identification and registration data
                </h3>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Full name (when voluntarily provided);</li>
                  <li>E-mail address;</li>
                  <li>
                    Authentication data — passwords stored in hashed format
                    (never in plain text).
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  3.2 Payment data
                </h3>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    <em>None.</em> The Service is currently free of charge and
                    we do not collect, process, or store any payment or billing
                    data. If paid plans are introduced in the future, this
                    policy will be updated before any payment data is
                    requested.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  3.3 Service usage data
                </h3>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Feature flags created, configured, and modified;</li>
                  <li>Audit logs (who performed each action and when);</li>
                  <li>
                    API access logs (keys used, environments, timestamps);
                  </li>
                  <li>Organization and project settings.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  3.4 Technical data
                </h3>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>IP address;</li>
                  <li>User agent (browser and operating system);</li>
                  <li>
                    Session cookies required for authentication (see Section
                    10);
                  </li>
                  <li>
                    Application logs for performance and error monitoring.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  3.5 Communication data
                </h3>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    E-mails exchanged with our team (support, member
                    invitations, account notifications).
                  </li>
                </ul>
              </div>
              <p className="text-cg-neutral-500 italic">
                We do not collect sensitive personal data as defined in Article
                5, II of the LGPD (health, biometrics, ethnic origin, religious
                beliefs, genetic data, etc.).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              4. Purposes and Legal Bases (LGPD)
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                We process personal data only when there is an adequate legal
                basis, under Article 7 of the LGPD:
              </p>
              <div className="border-cg-bg-100 overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-cg-bg-100 bg-cg-bg-100/50 border-b">
                      <th className="text-cg-neutral-200 w-3/5 px-4 py-3 font-semibold">
                        Purpose
                      </th>
                      <th className="text-cg-neutral-200 w-2/5 px-4 py-3 font-semibold">
                        Legal Basis (LGPD Art. 7)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-cg-bg-100 divide-y">
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Service provision (authentication, flags, environments)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Contract performance (item V)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Payment processing and billing
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Not applicable — the Service is currently free of
                        charge; no payment data is collected
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Issuance of service invoice (NFS-e)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Not applicable while the Service is free of charge
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Transactional communications (alerts, confirmations,
                        invitations)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Contract performance (item V)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Marketing and newsletters (opt-in)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Consent (item I) — revocable at any time
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Security, fraud and abuse prevention
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Legitimate interest (item IX)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Service improvement (aggregated and anonymized usage
                        analytics)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Legitimate interest (item IX)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Defense in judicial or administrative proceedings
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Regular exercise of rights (item VI)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              5. Data Sharing
            </h2>
            <div className="text-cg-neutral-300 space-y-4 text-sm leading-relaxed">
              <p className="text-cg-neutral-200 font-medium">
                We do not sell, rent, or trade Users' personal data.
              </p>
              <p>
                We may share data with the following operators, which are
                contractually bound to process it only in accordance with our
                instructions and in compliance with the LGPD:
              </p>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  5.1 Data operators (processors)
                </h3>
                <ul className="border-cg-bg-100 space-y-2 border-l pl-4">
                  <li>
                    <span className="text-cg-neutral-200">
                      Transactional e-mail provider
                    </span>{' '}
                    (Resend): sending notifications, invitations, and account
                    communications;
                  </li>
                  <li>
                    <span className="text-cg-neutral-200">
                      Cloud infrastructure providers
                    </span>{' '}
                    (e.g., Railway, Neon, Upstash, or similar): hosting,
                    database, and cache.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  5.2 Competent authorities
                </h3>
                <p>
                  We may disclose personal data when legally required by a
                  court decision or a competent administrative or regulatory
                  authority, including the ANPD.
                </p>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  5.3 Transfer of control
                </h3>
                <p>
                  In the event of a merger, acquisition, or sale of assets,
                  personal data may be transferred to the acquirer, which will
                  be bound by this Policy or an equivalent one, with prior
                  notice to the affected data subjects.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              6. International Data Transfer
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Our infrastructure providers may store and process data on
                servers located outside Brazil, including in the United States
                and the European Union.
              </p>
              <p>
                Such transfers are carried out in compliance with Article 33 of
                the LGPD, through contractual clauses with the operators or to
                countries that provide a level of data protection equivalent to
                that required by Brazilian law.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              7. Data Retention and Deletion
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                We keep personal data for as long as necessary for the purposes
                for which it was collected, observing the legal deadlines:
              </p>
              <div className="border-cg-bg-100 overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-cg-bg-100 bg-cg-bg-100/50 border-b">
                      <th className="text-cg-neutral-200 w-3/5 px-4 py-3 font-semibold">
                        Data Category
                      </th>
                      <th className="text-cg-neutral-200 w-2/5 px-4 py-3 font-semibold">
                        Retention Period
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-cg-bg-100 divide-y">
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Active account data
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        While the account is active
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Data after account cancellation
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        90 days for download; after that, deleted from active
                        servers
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Tax and financial records
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        5 years (legal obligation)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Service audit logs
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">2 years</td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Marketing data (with consent)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Until consent is revoked
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Support and communications data
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">3 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                After the above deadlines expire, the data is deleted or
                irreversibly anonymized.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              8. Data Subject Rights (LGPD, Article 18)
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                As a data subject, you have the following rights regarding the
                processing carried out by CanaryGate:
              </p>
              <ul className="border-cg-bg-100 space-y-2 border-l pl-4">
                <li>
                  <span className="text-cg-neutral-200">Confirmation:</span>{' '}
                  confirm whether we process your data;
                </li>
                <li>
                  <span className="text-cg-neutral-200">Access:</span> obtain a
                  copy of your processed personal data;
                </li>
                <li>
                  <span className="text-cg-neutral-200">Correction:</span>{' '}
                  request the correction of incomplete, inaccurate, or outdated
                  data;
                </li>
                <li>
                  <span className="text-cg-neutral-200">
                    Anonymization, blocking, or deletion:
                  </span>{' '}
                  of unnecessary, excessive, or data processed in
                  non-compliance with the LGPD;
                </li>
                <li>
                  <span className="text-cg-neutral-200">Portability:</span>{' '}
                  receive your data in a structured and interoperable format;
                </li>
                <li>
                  <span className="text-cg-neutral-200">
                    Deletion by consent:
                  </span>{' '}
                  request the deletion of data whose processing is based on
                  consent;
                </li>
                <li>
                  <span className="text-cg-neutral-200">
                    Information on sharing:
                  </span>{' '}
                  know which entities we share your data with;
                </li>
                <li>
                  <span className="text-cg-neutral-200">
                    Consent revocation:
                  </span>{' '}
                  withdraw consent at any time, without prejudice to the
                  processing already carried out; and
                </li>
                <li>
                  <span className="text-cg-neutral-200">Opposition:</span>{' '}
                  object to processing carried out without an adequate legal
                  basis.
                </li>
              </ul>
              <div className="bg-cg-bg-100/40 border-cg-bg-100 mt-4 rounded-lg border p-4">
                <p className="text-cg-neutral-200 mb-1 font-medium">
                  How to exercise your rights:
                </p>
                <p>
                  Send a request to{' '}
                  <a
                    href="mailto:rcborges98@gmail.com"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    rcborges98@gmail.com
                  </a>{' '}
                  with the subject{' '}
                  <span className="text-cg-neutral-200">
                    &ldquo;LGPD Rights — [your name]&rdquo;
                  </span>
                  . We will respond within up to 15 (fifteen) calendar days,
                  pursuant to Article 19, II of the LGPD.
                </p>
                <p className="mt-2">
                  You may also file a complaint directly with the ANPD at{' '}
                  <a
                    href="https://www.gov.br/anpd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    www.gov.br/anpd
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              9. Data Security
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                We adopt technical and organizational measures to protect
                personal data against unauthorized access, destruction, loss,
                alteration, or improper disclosure:
              </p>
              <ul className="list-inside list-disc space-y-1.5 pl-2">
                <li>Encrypted data transmission via TLS (HTTPS);</li>
                <li>
                  Passwords stored in hash with a secure algorithm — never in
                  plain text;
                </li>
                <li>
                  Access to personal data restricted to those who need it to
                  perform their duties;
                </li>
                <li>Security monitoring and access logs; and</li>
                <li>Isolation of production environments.</li>
              </ul>
              <p>
                In the event of a security incident that may pose relevant risk
                or harm to data subjects, we will notify the ANPD and the
                affected data subjects within a reasonable period, pursuant to
                Article 48 of the LGPD.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              10. Cookies and Similar Technologies
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>We use the following types of cookies:</p>
              <div className="border-cg-bg-100 overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-cg-bg-100 bg-cg-bg-100/50 border-b">
                      <th className="text-cg-neutral-200 px-4 py-3 font-semibold">
                        Type
                      </th>
                      <th className="text-cg-neutral-200 px-4 py-3 font-semibold">
                        Purpose
                      </th>
                      <th className="text-cg-neutral-200 px-4 py-3 font-semibold">
                        Required
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-cg-bg-100 divide-y">
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Session / authentication
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Keep the User authenticated while browsing
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">Yes</td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Preferences
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Store interface settings
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">No</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                We do not use tracking cookies for advertising purposes.
                Disabling session cookies in your browser settings will prevent
                access to authenticated features.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              11. Minors
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                The Service is not intended for children. Under Article 14 of
                the LGPD, we do not intentionally collect personal data from
                children (under 12 years old) or adolescents (under 18 years
                old) without the specific and prominent consent of at least one
                parent or legal guardian.
              </p>
              <p>
                If we become aware that data from minors was collected without
                adequate consent, we will delete it immediately.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              12. Changes to This Policy
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                We may update this Policy periodically. Relevant changes will
                be communicated at least 30 (thirty) days in advance, by
                e-mail or in-platform notification.
              </p>
              <p>
                Continued use of the Service after the changes take effect
                constitutes acceptance of the new Policy. If you do not agree
                with the changes, you must cancel your account before the
                effective date.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              13. Contact and Support Channel
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                To exercise your rights, ask questions, or file complaints
                about the processing of personal data:
              </p>
              <ul className="border-cg-bg-100 space-y-1.5 border-l pl-4">
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    Data Protection Officer (DPO):
                  </span>{' '}
                  Rafael Castilho e Borges
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    E-mail:
                  </span>{' '}
                  <a
                    href="mailto:rcborges98@gmail.com"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    rcborges98@gmail.com
                  </a>
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    Supervisory authority (ANPD):
                  </span>{' '}
                  <a
                    href="https://www.gov.br/anpd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    www.gov.br/anpd
                  </a>{' '}
                  | ouvidoria@anpd.gov.br
                </li>
              </ul>
            </div>
          </section>
        </div>

        <div className="border-cg-bg-100 mt-16 border-t pt-8">
          <p className="text-cg-neutral-600 text-xs">
            © {new Date().getFullYear()} CanaryGate. This Policy was drafted
            in compliance with Law No. 13.709/2018 (LGPD) and the Brazilian
            Civil Rights Framework for the Internet (Marco Civil da Internet —
            Law No. 12.965/2014).
          </p>
        </div>
      </div>

      <LandingFooter />
    </main>
  )
}