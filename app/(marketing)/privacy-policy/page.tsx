export const metadata = {
  title: 'Privacy Policy — Prayer Wall',
}

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold text-zinc-900">Prayer Wall Privacy Policy</h1>
        <p className="mt-3 text-sm font-semibold text-zinc-700">Last updated: July 7, 2026</p>

        {/* 1 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">1. Who this policy covers</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Prayer Wall is provided to churches (&ldquo;<strong>Church</strong>,&rdquo;{' '}
            &ldquo;<strong>Customer</strong>,&rdquo; &ldquo;<strong>you</strong>&rdquo; when
            referring to the organization) as a platform for their congregation members
            (&ldquo;<strong>Members</strong>,&rdquo; &ldquo;<strong>Users</strong>,&rdquo;{' '}
            &ldquo;<strong>you</strong>&rdquo; when referring to an individual) to submit and view
            prayer requests and praise reports.
          </p>
          <p className="mt-4 leading-relaxed text-zinc-700">
            This policy explains what information we collect, how we use it, and the choices
            available to you. Because Prayer Wall is used by a Church with its own congregation,
            some responsibilities are shared between Prayer Wall (the platform operator) and the
            Church (which operates its own community and sets its own moderation practices).
            Section 8 explains this relationship in more detail.
          </p>
        </section>

        {/* 2 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">2. Information we collect</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            <strong>Account information.</strong> When you sign in (via email magic link or Google
            sign-in), we collect your name, email address, and profile photo (if provided by
            Google).
          </p>
          <p className="mt-4 leading-relaxed text-zinc-700">
            <strong>Submissions.</strong> When you submit a prayer request or praise report, we
            collect the content you submit, whether you&rsquo;ve chosen to submit anonymously,
            and — if you link a praise report to a prior prayer request — that connection.
          </p>
          <p className="mt-4 leading-relaxed text-zinc-700">
            <strong>Reactions.</strong> When you react to a submission (🙏 / 🙌 / ❤️), we record
            that you reacted, which submission you reacted to, and which church it belongs to.
          </p>
          <p className="mt-4 leading-relaxed text-zinc-700">
            <strong>Usage and technical information.</strong> We collect standard technical
            information (IP address, browser type, device information) for security and
            service-operation purposes.
          </p>
        </section>

        {/* 3 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">
            3. How anonymous submissions actually work
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            If you choose to submit anonymously, your name is not displayed to other members on
            the public wall. However:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-zinc-700">
            <li>
              Your submission is still linked to your account internally, so that you can see your
              own submission on your personal wall view regardless of its moderation status, and so
              a moderator can identify you if the content requires pastoral follow-up or safety
              escalation (see Section 5).
            </li>
            <li>
              &ldquo;Anonymous&rdquo; means anonymous to other congregation members, not anonymous
              to your church&rsquo;s moderation team or to Prayer Wall.
            </li>
          </ul>
        </section>

        {/* 4 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">4. How we use your information</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">We use your information to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-zinc-700">
            <li>
              Operate the submission, moderation, and wall-display features of the service
            </li>
            <li>
              Send notifications when someone reacts to your submission (unless you&rsquo;ve
              disabled notifications)
            </li>
            <li>Send your church&rsquo;s weekly summary digest to designated recipients</li>
            <li>Maintain the security and integrity of the platform</li>
            <li>Communicate with you about service updates</li>
          </ul>
          <p className="mt-4 leading-relaxed text-zinc-700">
            We do not sell your information, and we do not use your submission content to train AI
            models or for advertising.
          </p>
        </section>

        {/* 5 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">
            5. Crisis and sensitive content handling
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Prayer Wall uses automated keyword detection to identify submissions that may indicate
            a mental health crisis, self-harm risk, or other urgent pastoral need. When such
            content is detected:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-zinc-700">
            <li>The submission is automatically held from public display</li>
            <li>
              Your church&rsquo;s designated pastoral or care contact is notified by email so they
              can follow up directly
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-zinc-700">
            <strong>This system has real limitations.</strong> Keyword detection cannot catch every
            instance of crisis language, and it is not a substitute for professional mental health
            support or emergency services.{' '}
            <strong>
              If you or someone you know is in crisis, please contact your local emergency services
              or a crisis helpline directly — do not rely on this platform for emergency response.
            </strong>
          </p>
        </section>

        {/* 6 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">
            6. Who we share information with
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            <strong>Your church.</strong> Your church&rsquo;s designated admins and moderators can
            see all submissions made within their church, including anonymous ones, as part of
            normal moderation.
          </p>
          <p className="mt-4 leading-relaxed text-zinc-700">
            <strong>Service providers.</strong> We use the following providers to operate Prayer
            Wall, each of which processes data on our behalf under their own security and privacy
            commitments:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-zinc-700">
            <li>
              <strong>Supabase</strong> — database, authentication, and real-time infrastructure
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery (notifications, digests)
            </li>
            <li>
              <strong>Vercel</strong> — application hosting
            </li>
            <li>
              <strong>Google</strong> — if you choose to sign in with Google
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-zinc-700">
            We do not share your information with any other third party, and we do not sell your
            information.
          </p>
          <p className="mt-4 leading-relaxed text-zinc-700">
            <strong>Cross-church visibility (technical note).</strong> Reaction records are
            technically readable across churches through certain API access patterns, though the
            underlying identity is a randomly generated ID that cannot, on its own, be resolved
            back to your name or email. We are aware of this and are working toward closing it
            entirely; in the meantime, no cross-church attacker can determine who you are from
            this alone.
          </p>
        </section>

        {/* 7 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">7. Data retention</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            We retain your account and submission data for as long as your church remains an
            active customer and you remain a member. If your church stops using Prayer Wall, or
            you request deletion, we will delete your personal information within 30 days, except
            where retention is required for legal or safety-related recordkeeping.
          </p>
        </section>

        {/* 8 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">
            8. The relationship between Prayer Wall and your church
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Prayer Wall provides the platform. Your church controls how it&rsquo;s configured —
            including moderation settings, keyword rules, branding, and who has access to
            submitted data as a moderator or admin. Questions about how your specific church
            handles your data, or requests to access, correct, or delete your information, should
            generally start with your church&rsquo;s admin team, who can also route the request to
            us if needed.
          </p>
        </section>

        {/* 9 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">9. Children and families</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Prayer Wall is a general-audience platform intended for congregation members. It is not
            directed at children, and we do not knowingly collect information from children under
            13 without appropriate consent. Because churches serve families, we rely on churches
            to apply appropriate access controls and supervision for any household or family
            accounts they choose to set up.
          </p>
        </section>

        {/* 10 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">10. Cookies</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            We use essential cookies required for authentication and session management. We do not
            use third-party advertising or tracking cookies.
          </p>
        </section>

        {/* 11 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">11. Your rights</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Depending on your location, you may have rights to access, correct, or delete your
            personal information, or to object to certain processing. To exercise these rights,
            contact your church admin or reach us directly at{' '}
            <a
              href="mailto:support@prayerwallapp.com"
              className="underline underline-offset-2 hover:text-zinc-900"
            >
              support@prayerwallapp.com
            </a>
            .
          </p>
        </section>

        {/* 12 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">
            12. International data transfers
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Prayer Wall&rsquo;s infrastructure providers may process and store data in
            jurisdictions outside your own, including the United States and Canada. By using
            Prayer Wall, you consent to this transfer.
          </p>
        </section>

        {/* 13 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">13. Governing law</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            This policy is governed by the laws of the Province of Quebec, Canada, without regard
            to conflict of law principles.
          </p>
        </section>

        {/* 14 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">14. Changes to this policy</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            We may update this policy from time to time. We&rsquo;ll update the &ldquo;Last
            updated&rdquo; date above, and for material changes, we&rsquo;ll make reasonable
            efforts to notify church admins.
          </p>
        </section>

        {/* 15 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">15. Contact us</h2>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Questions about this policy can be sent to{' '}
            <a
              href="mailto:support@prayerwallapp.com"
              className="underline underline-offset-2 hover:text-zinc-900"
            >
              support@prayerwallapp.com
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
