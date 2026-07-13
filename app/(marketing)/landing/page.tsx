'use client'

import { useState } from 'react'
import {
  Check,
  ChevronDown,
  ShieldCheck,
  MonitorPlay,
  Inbox,
  Radio,
  ArrowRight,
  Quote,
  Send,
} from 'lucide-react'

// Fonts: Lexend + Inter are loaded by app/layout.tsx via next/font/google.
// --font-lexend and --font-inter CSS vars are set on <body>.
// Tailwind's font-display class maps to var(--font-lexend).
// No second font load needed here.

const TOKENS = {
  page: '#FFFFFF',
  surface: '#F7F9FC',
  paper: '#FFFFFF',
  ink: '#111827',
  inkSoft: '#5B6472',
  navy: '#0B1220',
  brand: '#2F86EB',
  brandDeep: '#1C5FC7',
  border: '#E4E8EE',
  prayer: '#9FE1CB',
  praise: '#FAC775',
  prayerDeep: '#2F8F6A',
  praiseDeep: '#B8791F',
}

const AVATAR_PALETTE = ['#9FE1CB', '#FAC775', '#2F86EB', '#F2A29B', '#8FB8E0', '#C9A6E8']

// PLACEHOLDER LOGOS — real files, no confirmed partnership yet.
// Move these paths to next/image <Image> tags when the section is re-enabled.
// Dimensions: hillsong 260×148, elevation 166×148, lakepointe 250×55, nouvelle-vie 204×192.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CHURCH_LOGOS = [
  { name: 'Hillsong', src: '/logos/hillsong-logo.png', width: 260, height: 148 },
  { name: 'Elevation Church', src: '/logos/elevation-logo.png', width: 166, height: 148 },
  { name: 'Église Nouvelle Vie', src: '/logos/nouvelle-vie-logo.png', width: 204, height: 192 },
  { name: 'Lakepointe Church', src: '/logos/lakepointe-logo.png', width: 250, height: 55 },
]

const WALL_CARDS = [
  { type: 'prayer', text: "Pray for my mom's surgery on Thursday, she's nervous.", name: 'Sarah M.', reactions: 14 },
  { type: 'praise', text: 'Got the job! Thank you for praying with me these past weeks.', name: 'Anonymous', reactions: 26 },
  { type: 'prayer', text: 'New semester nerves for my daughter starting middle school.', name: 'David K.', reactions: 8 },
  { type: 'praise', text: 'Our marriage was restored after three hard years apart.', name: 'Anonymous', reactions: 41 },
]

const FEATURES = [
  { icon: Inbox, title: 'Submit in seconds', body: 'A magic link and a quick tap is all it takes to share a prayer request or praise report.', pill: null as string | null, mock: 'submit' as const },
  { icon: Radio, title: 'Live prayer wall', body: 'Approved posts appear instantly in a grid the whole congregation can scroll and react to.', pill: null as string | null, mock: 'wall' as const },
  { icon: ShieldCheck, title: 'Admin dashboard', body: "Your care team's moderation tools live here. Approve, hold, or escalate every submission, with keyword rules that auto-flag sensitive language.", pill: null as string | null, mock: 'inbox' as const },
  { icon: MonitorPlay, title: 'Big-screen display', body: 'Put the live wall on your auditorium screens or foyer TVs, auto-scrolling and always current.', pill: 'Coming at launch', mock: 'display' as const },
]

const STEPS = [
  { n: '01', title: 'Submit', body: 'A member shares a prayer request or praise report from their phone.', mock: 'submit' as const },
  { n: '02', title: 'Moderate', body: 'Your team reviews it in the admin dashboard, then approves, holds, or escalates.', mock: 'inbox' as const },
  { n: '03', title: 'Displayed live', body: 'Approved posts appear on the wall instantly, in the app and on screen.', mock: 'wall' as const },
]

const TIERS = [
  {
    name: 'Always Free',
    price: 'Free',
    period: '',
    tagline: 'Everything a church needs to start.',
    features: ['Unlimited submissions', 'Public prayer wall', 'Admin dashboard & moderation', 'Weekly email digest', 'Your subdomain'],
    highlight: false,
    pill: null as string | null,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    tagline: 'For churches ready to put it on screen.',
    features: ['Everything in Always Free', 'Display app for screens', 'AI-assisted moderation', 'Advanced keyword rules', 'Remove platform watermark'],
    highlight: true,
    pill: 'Coming at launch',
  },
]

const FAQS = [
  { q: "Is our congregation's data private?", a: "Yes. Every church's data is isolated at the database level, not just in the app. One church can never see another's submissions, members, or settings." },
  { q: "Does this fit our church's style?", a: "Prayer Wall is built for contemporary, expressive worship. The language, colors, and even the labels are yours to rename in your dashboard." },
  { q: 'Do we need a tech team to set it up?', a: 'No. Add your logo and colors, and your church is live on its own subdomain in minutes. No developer required.' },
  { q: 'What does moderation actually look like?', a: "Every submission goes to your admin dashboard's review queue before it's public. Keyword rules can auto-hold sensitive language or escalate it straight to a pastor's inbox." },
  { q: 'When can we get access?', a: "We're onboarding a small group of churches first. Join the waitlist and we'll reach out personally as spots open." },
]

// PLACEHOLDER — anonymized, role-only. Not real named customers (product is pre-launch).
const EARLY_VOICES = [
  { role: 'Senior Pastor, early access conversation', quote: "Our biggest fear is a bad post going live unreviewed. Knowing everything's held for approval first is the whole pitch for us.", initials: 'SP' },
  { role: 'Church Admin, early access conversation', quote: 'Half our congregation already watches the screens more than they read the bulletin. Getting prayer requests up there is huge.', initials: 'CA' },
  { role: 'Care Pastor, early access conversation', quote: 'We want people to feel cared for, not just logged. Following up personally matters more than the tech.', initials: 'CP' },
]

type MockKind = 'submit' | 'inbox' | 'display' | 'wall'

function MiniMock({ kind }: { kind: MockKind }) {
  if (kind === 'submit') {
    return (
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <div className="mb-2 h-2 w-16 rounded-full" style={{ background: TOKENS.border }} />
        <div className="rounded-lg border p-2.5 text-[11px]" style={{ borderColor: TOKENS.border, color: TOKENS.inkSoft }}>
          Pray for my mom&apos;s surgery Thursday...
        </div>
        <div className="mt-2 flex justify-end">
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white" style={{ background: TOKENS.brand }}>
            Submit <Send size={10} />
          </span>
        </div>
      </div>
    )
  }
  if (kind === 'inbox') {
    return (
      <div className="space-y-1.5 rounded-xl bg-white p-3 shadow-sm">
        {(['Hold', 'Approve', 'Approve'] as const).map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ background: TOKENS.surface }}>
            <span className="h-1.5 w-14 rounded-full" style={{ background: '#D3DAE3' }} />
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
              style={{
                background: s === 'Hold' ? `${TOKENS.praiseDeep}18` : `${TOKENS.prayerDeep}18`,
                color: s === 'Hold' ? TOKENS.praiseDeep : TOKENS.prayerDeep,
              }}
            >
              {s}
            </span>
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'display') {
    return (
      <div className="rounded-xl bg-[#0B1220] p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-md p-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-1 w-8 rounded-full" style={{ background: i % 2 ? TOKENS.praise : TOKENS.prayer }} />
              <div className="mt-1.5 h-1 w-full rounded-full bg-white/15" />
              <div className="mt-1 h-1 w-2/3 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  // wall
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {WALL_CARDS.slice(0, 4).map((c, i) => (
        <div
          key={i}
          className="rounded-lg border-l-2 bg-white p-2 shadow-sm"
          style={{ borderColor: TOKENS.border, borderLeftColor: c.type === 'prayer' ? TOKENS.prayerDeep : TOKENS.praiseDeep }}
        >
          <div className="h-1 w-full rounded-full" style={{ background: '#E7EAF0' }} />
          <div className="mt-1 h-1 w-2/3 rounded-full" style={{ background: '#E7EAF0' }} />
        </div>
      ))}
    </div>
  )
}

function Badge() {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
    >
      Early access opening soon
    </span>
  )
}

function ComingSoonPill() {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: TOKENS.surface, color: TOKENS.inkSoft }}
    >
      Coming soon
    </span>
  )
}

function WaitlistForm({ dark = false, id }: { dark?: boolean; id: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setStatus('error')
        setErrorMessage((body as { error?: string }).error ?? 'Something went wrong. Please try again.')
        return
      }
      setStatus('done')
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'done') {
    return (
      <div
        className="flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium"
        style={{ background: dark ? 'rgba(159,225,203,0.15)' : 'rgba(255,255,255,0.9)', color: dark ? TOKENS.prayer : TOKENS.prayerDeep }}
      >
        <Check size={16} />
        You&apos;re on the list. We&apos;ll be in touch.
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row" id={id}>
        <label htmlFor={`${id}-email`} className="sr-only">Church or work email</label>
        <input
          id={`${id}-email`}
          type="email"
          required
          placeholder="you@yourchurch.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'submitting'}
          className="w-full rounded-full border px-4 py-3 text-sm outline-none transition focus-visible:ring-2 disabled:opacity-60"
          style={{
            background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)',
            borderColor: dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.5)',
            color: dark ? '#fff' : TOKENS.ink,
          }}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
          style={{ background: dark ? TOKENS.brand : '#fff', color: dark ? '#fff' : TOKENS.brand }}
        >
          {status === 'submitting' ? 'Joining…' : 'Join waitlist'}
          {status !== 'submitting' && <ArrowRight size={15} />}
        </button>
      </form>
      {status === 'error' && (
        <p className="mt-2 px-1 text-sm" style={{ color: dark ? '#FCA5A5' : '#DC2626' }}>{errorMessage}</p>
      )}
    </div>
  )
}

function WallPreview() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border p-4 shadow-[0_30px_70px_-30px_rgba(20,23,31,0.4)] sm:p-5"
      style={{ background: '#FFFFFF', borderColor: TOKENS.border }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" style={{ background: TOKENS.prayerDeep }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: TOKENS.prayerDeep }} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: TOKENS.inkSoft }}>Live wall, Grace Community</span>
        </div>
        <span className="hidden text-xs font-medium sm:inline" style={{ color: TOKENS.inkSoft }}>gracecommunity.prayerwallapp.com</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {WALL_CARDS.map((card, i) => {
          const color = card.type === 'prayer' ? TOKENS.prayerDeep : TOKENS.praiseDeep
          const emoji = card.type === 'prayer' ? '🙏' : '🙌'
          return (
            <div key={i} className={`rounded-xl border border-l-4 bg-[#FBFCFE] p-3.5 ${i === 1 ? 'wall-card-breathe' : ''} ${i >= 2 ? 'hidden sm:block' : ''}`} style={{ borderColor: TOKENS.border, borderLeftColor: color }}>
              <p className="text-[13px] leading-snug" style={{ color: TOKENS.ink }}>{card.text}</p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] font-medium" style={{ color: TOKENS.inkSoft }}>{card.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${color}15`, color }}>{emoji} {card.reactions}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function WaitlistLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div style={{ background: TOKENS.page, color: TOKENS.ink, fontFamily: 'var(--font-inter), sans-serif' }}>
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* HERO BANNER, contained, icy-blue gradient, nav inside */}
        <section
          className="relative overflow-hidden rounded-[36px] px-6 pb-8 pt-6 text-white sm:px-10 sm:pb-56 sm:pt-8"
          style={{ background: 'linear-gradient(180deg, #5B9FE6 0%, #7DB8F0 35%, #BFE0FB 75%, #F4FAFF 100%)' }}
        >
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-base font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm">🙏</span>
              Prayer Wall
            </div>
            <div className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
              <a href="#product" className="hover:text-white">Product</a>
              <a href="#how-it-works" className="hover:text-white">How it works</a>
              <a href="#pricing" className="hover:text-white">Pricing</a>
              <a href="#faq" className="hover:text-white">FAQ</a>
            </div>
            <a href="#waitlist" className="rounded-full bg-white px-4 py-2 text-sm font-semibold transition hover:opacity-90" style={{ color: TOKENS.brand }}>
              Join waitlist
            </a>
          </nav>

          <div className="mx-auto mt-14 max-w-2xl text-center sm:mt-20">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge />
            </div>
            <h1 className="font-display mt-5 text-[2.1rem] font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              See every prayer. Care for every member.
            </h1>
            <p className="mx-auto mt-4 max-w-sm px-2 text-[15px] leading-relaxed text-white/85 sm:px-0 sm:text-[17px]">
              A shared, moderated space where your pastoral team can follow up in real time.
            </p>
            <div className="mt-8 flex justify-center px-2 sm:px-0" id="waitlist">
              <WaitlistForm id="hero" />
            </div>
            <p className="mt-3 text-xs text-white/70">Free for churches at launch. No spam, ever.</p>
          </div>

          {/* wall preview card overflowing the bottom edge of the banner */}
          <div className="relative mt-10 sm:absolute sm:inset-x-0 sm:-bottom-16 sm:mt-0 sm:px-16">
            <div className="mx-auto max-w-3xl">
              <WallPreview />
            </div>
          </div>
        </section>
      </div>

      {/*
        TODO: re-enable once church approvals are confirmed — see Josiah
        Each church must explicitly sign off before their marks appear here.
        Using their logos without permission implies an endorsement that does not exist.

      <section className="mt-24 sm:mt-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9AA3B2" }}>
            Built for churches like these
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {CHURCH_LOGOS.map((logo) => (
              <Image
                key={logo.name}
                src={logo.src}
                alt={logo.name}
                width={logo.width}
                height={logo.height}
                className="h-8 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 sm:h-9"
              />
            ))}
          </div>
        </div>
      </section>
      */}

      {/* FEATURES, mockup-in-card grid */}
      <section id="product" className="mt-24 sm:mt-32" style={{ background: TOKENS.surface }}>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-[1.75rem] font-semibold tracking-tight sm:text-4xl">Features designed for your congregation.</h2>
            <p className="mt-3 text-[15px]" style={{ color: TOKENS.inkSoft }}>
              One live database. Submit on a phone, moderate in the admin dashboard, and see it on the wall instantly.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <div key={i} className="rounded-3xl p-6" style={{ background: TOKENS.paper, border: `1px solid ${TOKENS.border}` }}>
                <div className="rounded-2xl p-4" style={{ background: TOKENS.surface }}>
                  <MiniMock kind={f.mock} />
                </div>
                <div className="mt-5 flex items-start justify-between gap-2">
                  <h3 className="font-display text-[16px] font-semibold">{f.title}</h3>
                  {f.pill && <ComingSoonPill />}
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: TOKENS.inkSoft }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS, connected vertical timeline */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-[1.75rem] font-semibold tracking-tight sm:text-4xl">
              Get started in three simple steps.
            </h2>
            <p className="mt-3 max-w-xs text-[15px]" style={{ color: TOKENS.inkSoft }}>
              One connected loop from submission to the big screen, no manual steps in between.
            </p>
          </div>

          <div className="relative">
            <div className="absolute bottom-6 left-[15px] top-6 w-px border-l border-dashed" style={{ borderColor: TOKENS.border }} />
            <div className="space-y-6">
              {STEPS.map((s) => (
                <div key={s.n} className="relative flex gap-4 sm:gap-5">
                  <span
                    className="font-display relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: TOKENS.brand }}
                  >
                    {s.n}
                  </span>
                  <div className="flex-1 rounded-2xl p-5" style={{ background: TOKENS.paper, border: `1px solid ${TOKENS.border}` }}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="font-display text-[15px] font-semibold">{s.title}</h3>
                        <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed" style={{ color: TOKENS.inkSoft }}>{s.body}</p>
                      </div>
                      <div className="w-28 shrink-0 rounded-xl p-2.5 sm:w-32" style={{ background: TOKENS.surface }}>
                        <MiniMock kind={s.mock} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EARLY VOICES — anonymized, role-only, not customer reviews */}
      <section style={{ background: TOKENS.surface }}>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-[1.75rem] font-semibold tracking-tight sm:text-4xl">What pastoral teams tell us they need.</h2>
            <p className="mt-3 text-[15px]" style={{ color: TOKENS.inkSoft }}>
              We&apos;re pre-launch. These are anonymized notes from early scoping conversations, not customer reviews yet.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {EARLY_VOICES.map((t, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: TOKENS.paper, border: `1px solid ${TOKENS.border}` }}>
                <Quote size={18} style={{ color: TOKENS.brand }} />
                <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: TOKENS.ink }}>&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: AVATAR_PALETTE[i % AVATAR_PALETTE.length] }}
                  >
                    {t.initials}
                  </span>
                  <p className="text-[12px] font-medium" style={{ color: TOKENS.inkSoft }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-[1.75rem] font-semibold tracking-tight sm:text-4xl">Free to start. No submission limits, ever.</h2>
          <p className="mt-3 text-[15px]" style={{ color: TOKENS.inkSoft }}>
            Pricing gates features, not volume. Both plans get unlimited prayer requests and praise reports.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-2xl gap-6 sm:grid-cols-2">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-3xl p-8"
              style={{
                background: t.highlight ? `linear-gradient(155deg, ${TOKENS.brand} 0%, ${TOKENS.brandDeep} 100%)` : TOKENS.paper,
                border: t.highlight ? 'none' : `1px solid ${TOKENS.border}`,
                color: t.highlight ? '#fff' : TOKENS.ink,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{t.name}</h3>
                {t.pill && (
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide" style={{ background: t.highlight ? 'rgba(255,255,255,0.18)' : TOKENS.surface, color: t.highlight ? '#fff' : TOKENS.inkSoft }}>
                    {t.pill}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm" style={{ color: t.highlight ? 'rgba(255,255,255,0.78)' : TOKENS.inkSoft }}>{t.tagline}</p>
              <div className="font-display mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">{t.price}</span>
                {t.period && <span className="text-sm" style={{ color: t.highlight ? 'rgba(255,255,255,0.78)' : TOKENS.inkSoft }}>{t.period}</span>}
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={15} className="mt-0.5 shrink-0" style={{ color: t.highlight ? '#fff' : TOKENS.prayerDeep }} />
                    <span style={{ color: t.highlight ? 'rgba(255,255,255,0.92)' : TOKENS.ink }}>{f}</span>
                  </li>
                ))}
              </ul>
              <a href="#waitlist" className="mt-8 flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition hover:opacity-90" style={{ background: t.highlight ? '#fff' : TOKENS.brand, color: t.highlight ? TOKENS.brand : '#fff' }}>
                Get early access
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ background: TOKENS.surface }}>
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <h2 className="font-display text-[1.75rem] font-semibold tracking-tight sm:text-4xl">Your questions, answered</h2>
          </div>
          <div className="mt-10">
            {FAQS.map((f, i) => {
              const open = openFaq === i
              return (
                <div key={f.q} className="border-t py-5" style={{ borderColor: TOKENS.border }}>
                  <button onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-center justify-between gap-4 text-left" aria-expanded={open}>
                    <span className="font-display text-[15px] font-medium">{f.q}</span>
                    <ChevronDown size={18} className="shrink-0 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: TOKENS.inkSoft }} />
                  </button>
                  {open && <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: TOKENS.inkSoft }}>{f.a}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* DARK FOOTER, CTA + nav + oversized wordmark */}
      <footer className="px-5 pb-6 pt-16 text-white sm:px-6" style={{ background: TOKENS.navy }}>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display mx-auto max-w-lg text-[1.75rem] font-semibold tracking-tight sm:text-4xl">
            Bring your congregation&apos;s prayers into one living wall.
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-[15px] text-white/55">
            Join the waitlist. We&apos;re onboarding churches in small groups, personally.
          </p>
          <div className="mt-8 flex justify-center px-2 sm:px-0">
            <WaitlistForm dark id="footer" />
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-6xl gap-8 border-t border-white/10 pt-10 text-sm sm:grid-cols-3">
          <div className="flex items-center justify-center gap-2 font-display font-semibold sm:justify-start">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-sm text-white" style={{ background: TOKENS.brand }}>🙏</span>
            Prayer Wall
          </div>
          <div className="flex justify-center gap-8 text-white/60 sm:justify-start">
            <a href="#product" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </div>
          <div className="text-center sm:text-right">
            <a href="mailto:support@prayerwallapp.com" className="text-white/60 hover:text-white">support@prayerwallapp.com</a>
          </div>
        </div>

        <div className="mt-10 overflow-hidden">
          <p
            className="font-display select-none whitespace-nowrap text-center font-semibold leading-none tracking-tight text-white/[0.06]"
            style={{ fontSize: 'clamp(2.75rem, 13vw, 8rem)' }}
            aria-hidden="true"
          >
            PRAYER WALL
          </p>
        </div>
        <div className="flex flex-col items-center justify-between gap-2 pb-2 pt-6 text-xs text-white/40 sm:flex-row">
          <span>&copy; {new Date().getFullYear()} Prayer Wall. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="/privacy-policy" className="hover:text-white/70">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-white/70">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
