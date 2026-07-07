export const metadata = {
  title: 'Terms of Service — Prayer Wall',
}

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-100 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <a href="/" className="font-semibold text-zinc-900 hover:text-zinc-600">
            Prayer Wall
          </a>
        </div>
      </header>

      {/* Draft notice */}
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold text-amber-800">
            DRAFT — NOT FINAL. Requires attorney review before publication.
          </p>
          <p className="mt-1 text-sm text-amber-700">
            This document was drafted by Claude (an AI) based on Prayer Wall&rsquo;s actual
            product architecture. It is a starting point for your lawyer, not a substitute for one.
          </p>
        </div>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-zinc-900">Prayer Wall Terms of Service</h1>
        <p className="mt-3 text-sm font-semibold text-zinc-700">Last updated: July 7, 2026</p>

        {/* 1 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">1. Acceptance of terms</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            By accessing or using Prayer Wall (the &ldquo;<strong>Service</strong>&rdquo;), you
            agree to be bound by these Terms of Service (&ldquo;<strong>Terms</strong>&rdquo;). If
            you&rsquo;re using the Service on behalf of a church or organization, you&rsquo;re
            agreeing on that organization&rsquo;s behalf and confirming you have the authority to
            do so.
          </p>
        </section>

        {/* 2 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">2. Description of service</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Prayer Wall is a platform that allows churches (&ldquo;<strong>Churches</strong>
            &rdquo;) to collect, moderate, and display prayer requests and praise reports from
            their congregation members (&ldquo;<strong>Members</strong>&rdquo;) on a branded,
            church-specific subdomain, and optionally on in-venue display screens.
          </p>
        </section>

        {/* 3 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">3. Accounts</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            <strong>Church accounts.</strong> A Church signs up for Prayer Wall and designates at
            least one administrator. The administrator can configure the church&rsquo;s settings,
            invite members, assign moderator roles, and manage subscription tier.
          </p>
          <p className="mt-4 leading-relaxed text-zinc-700">
            <strong>Member accounts.</strong> Members join a specific church&rsquo;s instance of
            Prayer Wall via that church&rsquo;s subdomain and sign in using email or Google
            authentication. A member account belongs to one church.
          </p>
          <p className="mt-4 leading-relaxed text-zinc-700">
            You&rsquo;re responsible for maintaining the confidentiality of your account
            credentials and for all activity under your account.
          </p>
        </section>

        {/* 4 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">4. Church responsibilities</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            As a Church using Prayer Wall, you&rsquo;re responsible for:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-zinc-700">
            <li>
              Moderating content submitted by your members in good faith and in a timely manner
            </li>
            <li>
              Designating an appropriate, monitored contact for crisis/escalation notifications
              (Section 6)
            </li>
            <li>
              Complying with applicable law regarding your congregation&rsquo;s data, including
              any additional consent or notice requirements specific to your jurisdiction or
              membership (e.g., regarding minors)
            </li>
            <li>
              Setting appropriate access and visibility policies within the tools Prayer Wall
              provides
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Prayer Wall provides the platform and moderation tools; the Church is responsible for
            how those tools are used within its own community.
          </p>
        </section>

        {/* 5 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">5. Acceptable use</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            You agree not to use Prayer Wall to submit content that:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-zinc-700">
            <li>Is illegal, threatening, harassing, or defamatory</li>
            <li>Infringes another person&rsquo;s intellectual property or privacy rights</li>
            <li>Contains hate speech or content promoting violence</li>
            <li>Impersonates another person</li>
          </ul>
          <p className="mt-4 leading-relaxed text-zinc-700">
            We reserve the right to remove content and suspend accounts that violate these terms,
            in addition to whatever moderation actions a Church&rsquo;s own admins take.
          </p>
        </section>

        {/* 6 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">
            6. Moderation and crisis-content limitations
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Prayer Wall includes automated keyword detection intended to flag submissions that may
            indicate a mental health crisis or urgent pastoral need, and to route them to a
            Church&rsquo;s designated contact.
          </p>
          <p className="mt-4 leading-relaxed text-zinc-700">
            <strong>
              This system is provided on a best-effort basis and has real limitations.
            </strong>{' '}
            It relies on keyword matching and will not catch every instance of concerning content,
            and it may sometimes flag content that isn&rsquo;t actually urgent.{' '}
            <strong>
              Prayer Wall is not a crisis service, emergency response system, or substitute for
              professional mental health care
            </strong>
            , and we make no guarantee that flagged content will be reviewed within any particular
            timeframe. To the fullest extent permitted by law, Prayer Wall and its operators
            disclaim liability for any harm arising from the failure of this system to detect or
            appropriately route sensitive content. Users in crisis should contact local emergency
            services or a crisis helpline directly.
          </p>
        </section>

        {/* 7 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">
            7. Content ownership and license
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            You retain ownership of the content you submit. By submitting content, you grant
            Prayer Wall and your Church a non-exclusive, worldwide, royalty-free license to store,
            display, and process that content for the purpose of operating the Service — including
            displaying approved submissions on your church&rsquo;s public wall and, if enabled, on
            in-venue display screens.
          </p>
        </section>

        {/* 8 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">
            8. Subscription tiers and billing
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Prayer Wall offers a Free tier and a paid Pro tier with additional features, as
            described on our pricing page. Pro subscriptions are currently billed and managed
            manually; automated billing terms will be added to these Terms once self-serve billing
            is introduced. Churches on the Free tier may display a Prayer Wall watermark on their
            public-facing wall.
          </p>
        </section>

        {/* 9 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">9. Termination</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            A Church may stop using the Service at any time. We may suspend or terminate access to
            the Service, for any Church or individual account, for violation of these Terms or for
            content or conduct that creates legal or safety risk. Upon termination, we will handle
            data as described in our Privacy Policy.
          </p>
        </section>

        {/* 10 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">10. Disclaimers</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without
            warranties of any kind, express or implied, including but not limited to warranties of
            merchantability, fitness for a particular purpose, or non-infringement. We do not
            guarantee that the Service will be uninterrupted, error-free, or secure at all times.
          </p>
        </section>

        {/* 11 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">11. Limitation of liability</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            To the fullest extent permitted by applicable law, Prayer Wall and its operators will
            not be liable for any indirect, incidental, special, consequential, or punitive
            damages, or any loss of data, arising from your use of the Service, including —
            without limitation — any harm arising from moderation delays, crisis-detection
            limitations described in Section 6, or unauthorized access to submitted content.
          </p>
        </section>

        {/* 12 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">12. Indemnification</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            You agree to indemnify and hold Prayer Wall harmless from any claims, damages, or
            expenses arising from your (or your Church&rsquo;s) violation of these Terms or misuse
            of the Service.
          </p>
        </section>

        {/* 13 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">13. Governing law</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            These Terms are governed by the laws of the Province of Quebec, Canada, without regard
            to conflict of law principles. Any disputes arising under these Terms will be subject
            to the exclusive jurisdiction of the courts of Quebec.
          </p>
        </section>

        {/* 14 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">14. Changes to these terms</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            We may update these Terms from time to time. We&rsquo;ll update the &ldquo;Last
            updated&rdquo; date above, and for material changes, we&rsquo;ll make reasonable
            efforts to notify Church administrators.
          </p>
        </section>

        {/* 15 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">15. Contact us</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Questions about these Terms can be sent to{' '}
            <a
              href="mailto:prayerwall@santehouse.co"
              className="underline underline-offset-2 hover:text-zinc-900"
            >
              prayerwall@santehouse.co
            </a>
            .
          </p>
        </section>
      </article>

      {/* Footer */}
      <footer className="border-t border-zinc-100 px-6 py-10 text-center">
        <p className="font-semibold">Prayer Wall</p>
        <p className="mt-1 text-sm text-zinc-500">Built for churches who care about community</p>
        <div className="mt-4 flex justify-center gap-6 text-sm text-zinc-500">
          <a href="/privacy-policy" className="underline-offset-2 hover:text-zinc-900 hover:underline">
            Privacy Policy
          </a>
          <a href="/terms-of-service" className="underline-offset-2 hover:text-zinc-900 hover:underline">
            Terms of Service
          </a>
        </div>
      </footer>
    </main>
  )
}
