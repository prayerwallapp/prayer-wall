'use client'

import { useToast, type ToastItem, type ToastVariant } from '@/lib/toast'

const TOAST_BG: Record<ToastVariant, string> = {
  success: 'bg-success text-success-on',
  warning: 'bg-warning text-warning-on',
  danger: 'bg-danger text-danger-on',
  info: 'bg-card text-primary border border-border',
}

const TOAST_ICON: Record<ToastVariant, string> = {
  success: '✓',
  warning: '!',
  danger: '✕',
  info: '🙏',
}

function SingleToast({ t, onDismiss }: { t: ToastItem; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex w-[340px] items-start gap-[10px] rounded-md px-md py-3 shadow-modal ${TOAST_BG[t.variant]}`}
    >
      <span className="shrink-0 text-[14px] font-semibold leading-normal font-body">
        {TOAST_ICON[t.variant]}
      </span>
      <p className="flex-1 min-w-0 text-body-sm leading-normal font-body break-words">
        {t.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-body-sm leading-normal opacity-45 hover:opacity-100 transition-opacity duration-150"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastViewport() {
  const { toasts, dismiss } = useToast()
  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Toast notifications"
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <SingleToast t={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  )
}
