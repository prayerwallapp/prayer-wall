type Props = {
  feature: string
  description: string
}

export default function UpgradePrompt({ feature, description }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-caption font-semibold text-brand-on">
          Pro
        </span>
        <h3 className="font-display text-h2 font-semibold text-primary">{feature}</h3>
      </div>
      <p className="text-body-sm text-muted">{description}</p>
      <a
        href="mailto:josiah@santehouse.co?subject=Prayer Wall Pro upgrade"
        className="w-fit rounded-full bg-brand px-5 py-[10px] text-label font-medium text-brand-on shadow-card"
      >
        Upgrade to Pro
      </a>
    </div>
  )
}
