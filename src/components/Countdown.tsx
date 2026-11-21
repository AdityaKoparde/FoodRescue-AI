import { minsLeft, remaining } from '../lib/format'

interface Props {
  from: number
  safeUntil: number
  now: number
  size?: number
  showLabel?: boolean
}

export function Countdown({ from, safeUntil, now, size = 46, showLabel }: Props) {
  const left = minsLeft(safeUntil, now)
  const total = Math.max(1, (safeUntil - from) / 60_000)
  const pct = Math.max(0, Math.min(1, left / total))
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const stroke =
    left <= 15
      ? 'var(--color-clay)'
      : left <= 45
        ? 'var(--color-amber-ink)'
        : 'var(--color-live-ink)'

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${Math.max(0, Math.round(left))} minutes of safe window left`}
        style={{ flex: 'none' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-rule)"
          strokeWidth={2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={2.5}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 240ms linear' }}
        />
      </svg>
      <div className="leading-tight">
        <div
          className="font-mono tnum"
          style={{ fontSize: size > 40 ? 16 : 13, color: stroke }}
        >
          {remaining(safeUntil, now)}
        </div>
        {showLabel && <div className="label mt-0.5">to cutoff</div>}
      </div>
    </div>
  )
}
