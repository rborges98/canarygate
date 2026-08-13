import type { Metadata } from 'next'
import { LandingNav } from '@/components/home/nav'
import { LandingFooter } from '@/components/home/footer'

export const metadata: Metadata = {
  title: 'Terms of Use — CanaryGate',
  description:
    'Terms and conditions of use of the CanaryGate platform. Read before creating your account.',
  alternates: {
    canonical: '/terms'
  },
  openGraph: {
    type: 'website',
    url: '/terms',
    siteName: 'CanaryGate',
    locale: 'en_US',
    title: 'Terms of Use — CanaryGate',
    description:
      'Terms and conditions of use of the CanaryGate platform. Read before creating your account.'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Use — CanaryGate',
    description:
      'Terms and conditions of use of the CanaryGate platform. Read before creating your account.'
  },
  robots: {
    index: true,
    follow: true
  }
}

export default function TermsPage() {
  return (
    <main className="bg-background text-cg-neutral-100">
      <LandingNav />

      <div className="mx-auto max-w-3xl px-4 pt-32 pb-24 sm:px-8">
        <div className="border-cg-bg-100 mb-12 border-b pb-8">
          <h1 className="text-cg-neutral-100 text-3xl font-bold">
            Terms of Use
          </h1>
          <p className="text-cg-neutral-500 mt-3 text-sm">
            Version 1.0 &mdash; Effective date:{' '}
            <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-xs text-yellow-400">
              [DATE: TO BE FILLED]
            </span>
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              1. Acceptance of These Terms
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                By creating an account, accessing or using CanaryGate
                (&ldquo;Service&rdquo;), you (&ldquo;User&rdquo;) declare that
                you have read, understood and agreed to these Terms of Use
                (&ldquo;Terms&rdquo;) and to our{' '}
                <a
                  href="/privacy"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </a>
                .
              </p>
              <p>
                If you are accepting these Terms on behalf of a company or
                another legal entity, you declare that you have the authority
                to bind it to these Terms.
              </p>
              <p>
                If you do not agree with any provision of these Terms, do not
                create an account or use the Service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              2. Definitions
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                For the purposes of these Terms, the following terms have the
                meanings set out below:
              </p>
              <ul className="border-cg-bg-100 space-y-2 border-l pl-4">
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    &ldquo;CanaryGate&rdquo;, &ldquo;we&rdquo; or
                    &ldquo;our&rdquo;
                  </span>{' '}
                  refers to Rafael Castilho e Borges,{' '}
                  <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-xs text-yellow-400">
                    [CNPJ: TO BE FILLED AFTER COMPANY REGISTRATION]
                  </span>
                  , with address at Rua Gaspar Magalhães, 415, Apto 302, Rio de
                  Janeiro, RJ, Brasil,{' '}
                  <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-xs text-yellow-400">
                    [ZIP CODE: TO BE FILLED]
                  </span>
                  .
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    &ldquo;Service&rdquo;
                  </span>{' '}
                  refers to the SaaS platform for feature flag management
                  available at canarygate.io and its subpages.
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    &ldquo;User&rdquo; or &ldquo;you&rdquo;
                  </span>{' '}
                  refers to any natural or legal person who accesses or uses
                  the Service.
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    &ldquo;User Data&rdquo;
                  </span>{' '}
                  refers to all data that the User inputs, creates or processes
                  through the Service, including feature flags, settings, API
                  keys and audit logs.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              3. Description of the Service
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                CanaryGate is a feature flag management platform that allows:
              </p>
              <ul className="list-inside list-disc space-y-1.5 pl-2">
                <li>
                  Creating and managing feature flags across multiple
                  environments;
                </li>
                <li>
                  Performing gradual and controlled rollouts of features;
                </li>
                <li>
                  Receiving real-time updates via SSE (Server-Sent Events);
                </li>
                <li>
                  Auditing changes with author and timestamp records; and
                </li>
                <li>
                  Integrating flag control into your applications through the
                  SDK and a documented REST API.
                </li>
              </ul>
              <p>
                The Service is provided under the Software as a Service (SaaS)
                model, accessible through a subscription or a free plan. The
                exact functionality of each plan is described on the{' '}
                <a
                  href="/#pricing"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  pricing page
                </a>
                .
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              4. Registration and Account
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                4.1. To use the Service, the User must create an account by
                providing a valid email address.
              </p>
              <p>
                4.2. The User is solely responsible for maintaining the
                confidentiality of their access credentials. CanaryGate is not
                liable for losses or damages arising from unauthorized use of
                the account attributable to the User&rsquo;s failure to protect
                their credentials.
              </p>
              <p>
                4.3. The User must immediately notify CanaryGate, by email{' '}
                <a
                  href="mailto:rcborges98@gmail.com"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  rcborges98@gmail.com
                </a>
                , in the event of unauthorized use of their account or any
                suspected security breach.
              </p>
              <p>
                4.4. Each account is personal and non-transferable, except in
                the context of organizations, where additional members may be
                invited in accordance with the platform&rsquo;s features.
              </p>
              <p>
                4.5. The User agrees to provide true, accurate, current and
                complete information during registration and to keep such
                information up to date.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              5. Plans, Pricing and Payments
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                5.1. CanaryGate offers a free plan with limited features and
                paid plans with additional features. The prices and features of
                each plan are available at{' '}
                <a
                  href="/#pricing"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  canarygate.io/#pricing
                </a>
                .
              </p>
              <p>
                5.2. Paid subscriptions are billed on a recurring basis
                (monthly or yearly, as selected at the time of purchase) and
                automatically renewed at the end of each period, unless
                cancelled by the User.
              </p>
              <p>
                5.3. The User may cancel automatic renewal at any time in the
                account settings. Cancellation takes effect at the end of the
                already-paid period.
              </p>
              <p>
                5.4. Prices are quoted in Brazilian reais (BRL) or US dollars
                (USD) as indicated on the pricing page. International users are
                subject to exchange rates and fees applied by their financial
                institution.
              </p>
              <p>
                5.5. In the event of payment failure after automatic billing
                attempts, CanaryGate will notify the User and may suspend or
                reclassify the account to the free plan.
              </p>
              <p>
                5.6. CanaryGate reserves the right to change plan prices with
                at least 30 (thirty) days&rsquo; prior notice, as described in
                Section 14.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              6. Right of Withdrawal and Cancellation
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                <span className="text-cg-neutral-100 font-medium">
                  6.1. Right of withdrawal (CDC, art. 49):
                </span>{' '}
                A User who purchases a paid plan may withdraw from the purchase
                within 7 (seven) calendar days from the date of the first
                charge, pursuant to art. 49 of the Consumer Protection Code
                (Código de Defesa do Consumidor &mdash; Law No. 8.078/1990). To
                exercise this right, the User must send written communication
                to{' '}
                <a
                  href="mailto:rcborges98@gmail.com"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  rcborges98@gmail.com
                </a>{' '}
                with the subject &ldquo;Contract Withdrawal&rdquo;. The amount
                paid will be fully refunded within up to 10 (ten) business
                days.
              </p>
              <p>
                <span className="text-cg-neutral-100 font-medium">
                  6.2. Cancellation after the withdrawal period:
                </span>{' '}
                After the 7 days, there will be no refund of amounts related to
                the current already-paid period. Cancellation stops automatic
                renewal, and the User retains access to the plan until the end
                of the paid period.
              </p>
              <p>
                6.3. Cancellation can be made at any time in the account
                settings or by email to{' '}
                <a
                  href="mailto:rcborges98@gmail.com"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  rcborges98@gmail.com
                </a>
                .
              </p>
              <p>
                6.4. After account closure, User Data will be kept for 90
                (ninety) days, during which the User may export it. After that
                period, the data may be deleted from our active servers,
                subject to retention obligations provided by law.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              7. Acceptable Use
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                7.1. The User agrees to use the Service only for lawful
                purposes and in accordance with these Terms, applicable laws
                and good practices for the use of internet services.
              </p>
              <p>
                7.2.{' '}
                <span className="text-cg-neutral-100 font-medium">
                  It is expressly forbidden to:
                </span>
              </p>
              <ul className="border-cg-bg-100 space-y-2 border-l pl-4">
                <li>
                  a) Use the Service for any illegal or unauthorized purpose;
                </li>
                <li>
                  b) Reverse engineer, decompile, disassemble or attempt to
                  extract the source code of the Service;
                </li>
                <li>
                  c) Reproduce, duplicate, copy, sell, resell or exploit any
                  part of the Service without the express written permission of
                  CanaryGate;
                </li>
                <li>
                  d) Use the Service to develop competing products or services;
                </li>
                <li>
                  e) Carry out brute force attacks, unauthorized access
                  attempts, code injection or any other action that compromises
                  the security or integrity of the Service;
                </li>
                <li>
                  f) Use automated scripts or bots to consume the Service
                  beyond the ordinary use provided for in the API
                  documentation;
                </li>
                <li>
                  g) Transmit viruses, malware or any malicious code;
                </li>
                <li>
                  h) Collect or store personal data of other users without the
                  appropriate legal basis.
                </li>
              </ul>
              <p>
                7.3. CanaryGate reserves the right to investigate and take
                appropriate action in response to violations of this section,
                including immediate suspension or termination of the account.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              8. Intellectual Property
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                8.1. The Service, including its software, interface, logos,
                trademarks, documentation and all associated materials, is the
                exclusive property of Rafael Castilho e Borges and is protected
                by Brazilian and international intellectual property laws.
              </p>
              <p>
                8.2. These Terms grant the User a limited, non-exclusive,
                non-transferable and revocable license to use the Service
                exclusively under the terms set out herein. The User acquires
                no ownership rights over the Service by using it.
              </p>
              <p>
                8.3. The &ldquo;CanaryGate&rdquo; trademark and its logo are
                trademarks owned by Rafael Castilho e Borges. Unauthorized use
                is prohibited.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              9. User Content and Data
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                9.1. The User retains ownership of all User Data entered or
                generated through the Service.
              </p>
              <p>
                9.2. By using the Service, the User grants CanaryGate a
                limited, non-exclusive and royalty-free license to store,
                process and transmit User Data solely for the provision of the
                Service.
              </p>
              <p>
                9.3. CanaryGate will not use User Data for any commercial
                purpose other than the provision of the Service, except with
                express consent.
              </p>
              <p>
                9.4. The User declares that they hold all necessary rights over
                the data entered into the Service and that such data does not
                violate third-party rights or applicable legislation.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              10. Privacy
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                The processing of personal data by CanaryGate is governed by
                our{' '}
                <a
                  href="/privacy"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </a>
                , incorporated into these Terms by reference. By using the
                Service, the User agrees to the personal data processing
                practices described therein.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              11. Service Availability
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                11.1. CanaryGate will make reasonable efforts to keep the
                Service available. However, we do not guarantee uninterrupted
                or error-free availability.
              </p>
              <p>
                11.2. The Service may be temporarily interrupted for
                maintenance, updates or due to circumstances beyond our
                reasonable control. When possible, scheduled maintenance will
                be communicated in advance by email or in-app notification.
              </p>
              <p>
                11.3. We are not liable for damages arising from Service
                unavailability, except within the limits provided by applicable
                Brazilian law.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              12. Limitation of Liability
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                12.1. The Service is provided &ldquo;as is&rdquo; and
                &ldquo;as available&rdquo;, without warranties of any kind,
                express or implied, including warranties of merchantability,
                fitness for a particular purpose or non-infringement.
              </p>
              <p>12.2. CanaryGate is not liable for:</p>
              <ul className="list-inside list-disc space-y-1.5 pl-2">
                <li>
                  indirect, incidental, special, punitive or consequential
                  damages;
                </li>
                <li>
                  loss of data, lost profits or business interruption;
                </li>
                <li>
                  failures in third-party infrastructure services (cloud
                  providers, networks, etc.); or
                </li>
                <li>improper use of the Service by the User themselves.</li>
              </ul>
              <p>
                12.3. In any case, CanaryGate&rsquo;s maximum liability to the
                User, for any cause, will be limited to the total amount paid
                by the User in the 12 (twelve) months preceding the event
                giving rise to liability, or R$&nbsp;100,00 (cem reais),
                whichever is higher.
              </p>
              <p>
                12.4. Nothing in this section excludes or limits liabilities
                that cannot be disclaimed under applicable Brazilian law,
                including the Consumer Protection Code and the LGPD.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              13. Indemnification
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                The User agrees to indemnify, defend and hold harmless
                CanaryGate and its representatives from any claims, damages,
                losses, liabilities, costs and expenses (including reasonable
                attorneys&rsquo; fees) arising from: (a) use of the Service in
                violation of these Terms; (b) violation of third-party rights
                through the Service; or (c) User Data that infringes
                intellectual property rights or other applicable laws.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              14. Modifications to the Service and the Terms
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                14.1. CanaryGate reserves the right to modify or discontinue,
                temporarily or permanently, the Service or any feature, with
                reasonable prior notice whenever possible.
              </p>
              <p>
                14.2. We may update these Terms periodically. Substantial
                changes (including price changes, usage limitations and User
                rights) will be communicated with at least 30 (thirty)
                days&rsquo; notice, by email and/or in-app notification.
              </p>
              <p>
                14.3. Continued use of the Service after the notice period
                constitutes acceptance of the new Terms. If the User does not
                agree with the changes, they must cancel the account before the
                effective date of the changes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              15. Termination
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                15.1. The User may cancel their account at any time in the
                account settings or by email{' '}
                <a
                  href="mailto:rcborges98@gmail.com"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  rcborges98@gmail.com
                </a>
                .
              </p>
              <p>
                15.2. CanaryGate may suspend or terminate the User&rsquo;s
                account, immediately and without prior notice, in the event of
                a material breach of these Terms, including acceptable use
                violations, fraud or any act that harms the Service or other
                users.
              </p>
              <p>
                15.3. After account termination for any reason, the provisions
                that by their nature should remain in force shall survive,
                including the sections on intellectual property, limitation of
                liability, indemnification, governing law and jurisdiction.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              16. Governing Law and Jurisdiction
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                16.1. These Terms are governed by the laws of the Federative
                Republic of Brazil, including the Consumer Protection Code
                (Código de Defesa do Consumidor &mdash; Law No. 8.078/1990),
                the Brazilian Civil Rights Framework for the Internet (Marco
                Civil da Internet &mdash; Law No. 12.965/2014) and the
                Brazilian General Data Protection Law (Lei Geral de Proteção de
                Dados &mdash; Law No. 13.709/2018, LGPD).
              </p>
              <p>
                16.2. The courts of the District of Rio de Janeiro, State of
                Rio de Janeiro, are elected to settle any disputes arising from
                these Terms, with express waiver of any other forum, no matter
                how privileged.
              </p>
              <p>
                16.3. For Users located outside Brazil, to the extent that
                mandatory local laws conflict with these Terms, such laws will
                prevail only to the extent of the conflict.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              17. General Provisions
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                17.1. These Terms, together with the Privacy Policy,
                constitute the entire agreement between the User and CanaryGate
                regarding the Service.
              </p>
              <p>
                17.2. CanaryGate&rsquo;s failure to exercise or enforce any
                right or provision of these Terms will not constitute a waiver
                of such right or provision.
              </p>
              <p>
                17.3. If any provision of these Terms is held to be invalid or
                unenforceable by a competent authority, the remaining
                provisions will remain in full force and effect.
              </p>
              <p>
                17.4. The User may not assign or transfer their rights or
                obligations arising from these Terms without the prior written
                consent of CanaryGate.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              18. Contact
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                For questions, requests or formal communications regarding
                these Terms:
              </p>
              <ul className="border-cg-bg-100 space-y-1.5 border-l pl-4">
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    Email:
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
                    Address:
                  </span>{' '}
                  Rua Gaspar Magalhães, 415, Apto 302, Rio de Janeiro, RJ,
                  Brasil —{' '}
                  <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-xs text-yellow-400">
                    [ZIP CODE: TO BE FILLED]
                  </span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        <div className="border-cg-bg-100 mt-16 border-t pt-8">
          <p className="text-cg-neutral-600 text-xs">
            © {new Date().getFullYear()} CanaryGate. By using the Service, you
            confirm that you have read and agreed to these Terms.
          </p>
        </div>
      </div>

      <LandingFooter />
    </main>
  )
}