import type { RescueStatus } from '../lib/types'

const MAP: Record<
  RescueStatus,
  { text: string; fg: string; bg: string; border: string }
> = {
  broadcast: {
    text: 'Live',
    fg: 'var(--color-live-ink)',
    bg: 'var(--color-live)',
    border: '#a5bf4f',
  },
  escalated: {
    text: 'Escalating',
    fg: 'var(--color-amber-ink)',
    bg: '#f6d9a6',
    border: '#d9a95c',
  },
  accepted: {
    text: 'Accepted',
    fg: 'var(--color-live-ink)',
    bg: '#e6f0c2',
    border: '#b6c97a',
  },
  closed: {
    text: 'Rescued',
    fg: 'var(--color-live-ink)',
    bg: '#dcebc0',
    border: '#a9c07a',
  },
  expired: {
    text: 'Lost',
    fg: 'var(--color-clay-ink)',
    bg: '#f0cfc5',
    border: '#cf9a8b',
  },
}

export function StatusPill({ status }: { status: RescueStatus }) {
  const s = MAP[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-[3px] text-[10.5px] font-medium uppercase tracking-[0.12em]"
      style={{
        color: s.fg,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 2,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 5,
          height: 5,
          background: s.fg,
          borderRadius: 999,
          display: 'inline-block',
        }}
      />
      {s.text}
    </span>
  )
}
