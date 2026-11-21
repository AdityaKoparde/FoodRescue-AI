import { clockSec, day } from '../lib/format'
import type { RescueEvent } from '../lib/types'

const DOT: Record<RescueEvent['kind'], string> = {
  system: 'var(--color-ink-3)',
  partner: 'var(--color-amber-ink)',
  human: 'var(--color-live-ink)',
}

export function Timeline({
  events,
  now,
}: {
  events: RescueEvent[]
  now: number
}) {
  const rows = [...events].reverse()
  const today = new Date(now).toDateString()

  return (
    <ol className="relative">
      {rows.map((e, i) => (
        <li
          key={`${e.at}-${i}`}
          className="grid grid-cols-[54px_14px_1fr] items-start gap-x-3 py-2"
          style={{
            borderTop: i === 0 ? 'none' : '1px solid var(--color-rule)',
          }}
        >
          <span
            className="font-mono tnum pt-[3px] text-[11px]"
            style={{ color: 'var(--color-ink-3)' }}
          >
            {clockSec(e.at)}
          </span>
          <span className="relative flex h-full justify-center pt-[7px]">
            <span
              aria-hidden
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: DOT[e.kind],
                display: 'block',
              }}
            />
            {i < rows.length - 1 && (
              <span
                aria-hidden
                className="absolute top-[16px] bottom-[-12px] w-px"
                style={{ background: 'var(--color-rule)' }}
              />
            )}
          </span>
          <span className="text-[13px] leading-snug">
            {new Date(e.at).toDateString() !== today && (
              <span style={{ color: 'var(--color-ink-3)' }}>{day(e.at)} · </span>
            )}
            {e.text}
          </span>
        </li>
      ))}
    </ol>
  )
}
