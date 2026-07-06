import WaitlistForm from './WaitlistForm'

// The platform's own landing page, served at the root domain (see
// middleware.ts, which rewrites `/` → `/landing` when no church subdomain
// is present). Colors here come from the CSS variables too — with no
// church context, app/layout.tsx sets --brand-color to the platform
// default (#6366F1), so this page is branded as Prayer Wall itself.

const STEPS = [
  {
    title: 'Members share',
    description:
      'Congregation members submit prayer requests and praise reports from their phone in seconds.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <rect x="7" y="2.5" width="10" height="19" rx="2" />
        <path d="M11 18.5h2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Your team reviews',
    description:
      'Every submission lands in a moderation inbox first. Approve, hold, or reject with one tap.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'It goes live on the wall',
    description:
      'Approved posts appear instantly on your church’s live wall — on the web and on any screen.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <rect x="2.5" y="4.5" width="19" height="12" rx="2" />
        <path d="M9 20.5h6M12 16.5v4" strokeLinecap="round" />
      </svg>
    ),
  },
]

const FEATURES = [
  {
    title: 'Live prayer wall grid',
    description:
      'A branded, real-time wall of prayer requests and praise reports at your church’s own subdomain.',
    pro: false,
  },
  {
    title: 'Moderation inbox',
    description:
      'Keyword safety rules, escalation alerts, and a simple approve/hold/reject queue for your team.',
    pro: false,
  },
  {
    title: 'Display app for screens',
    description:
      'A fullscreen, auto-updating wall built for TVs and projectors in your lobby or sanctuary.',
    pro: true,
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-20 pt-24 text-center">
        <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-[var(--brand-color)]">
          Prayer Wall
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Your church&rsquo;s prayer wall, live on any screen.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-zinc-600">
          Congregation members share prayer requests and praise reports. Your team
          moderates. The wall comes alive.
        </p>
        <a
          href="#waitlist"
          className="mt-8 rounded-md px-6 py-3 text-base font-medium text-white shadow-sm bg-[var(--brand-color)]"
        >
          Request early access
        </a>
        <p className="mt-3 text-sm text-zinc-400">Free to start. No credit card.</p>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-100 bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold">How it works</h2>
          <div className="grid gap-10 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--brand-color)] shadow-sm">
                  {step.icon}
                </div>
                <h3 className="mb-2 font-semibold">
                  {index + 1}. {step.title}
                </h3>
                <p className="text-sm text-zinc-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold">
            Everything a church needs to pray together
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="font-semibold">{feature.title}</h3>
                  {feature.pro && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white bg-[var(--brand-color)]">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="border-t border-zinc-100 bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-2xl font-semibold">Join the waitlist</h2>
          <p className="mt-2 text-sm text-zinc-600">
            We&rsquo;re onboarding churches a few at a time. Leave your email and
            we&rsquo;ll be in touch.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 px-6 py-10 text-center">
        <p className="font-semibold">Prayer Wall</p>
        <p className="mt-1 text-sm text-zinc-500">
          Built for churches who care about community
        </p>
      </footer>
    </main>
  )
}
