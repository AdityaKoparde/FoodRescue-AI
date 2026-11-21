import type { Rescue } from './types'

const MIN = 60_000

export function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function clockSec(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** minutes remaining, can be negative */
export function minsLeft(safeUntil: number, now: number): number {
  return (safeUntil - now) / MIN
}

/** "1h 04m" above an hour, "12:41" below it, "—" when gone */
export function remaining(safeUntil: number, now: number): string {
  const ms = safeUntil - now
  if (ms <= 0) return 'past cutoff'
  const totalMin = Math.floor(ms / MIN)
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${h}h ${String(m).padStart(2, '0')}m`
  }
  const m = Math.floor(ms / MIN)
  const s = Math.floor((ms % MIN) / 1000)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ago(ts: number, now: number): string {
  const m = Math.max(0, Math.floor((now - ts) / MIN))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m ago`
  return `${Math.floor(h / 24)}d ago`
}

export function span(ms: number): string {
  const m = Math.round(ms / MIN)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h}h ${rest}m` : `${h}h`
}

/** "18 min before the cutoff" for tight windows, "6h 34m before the cutoff" for long ones */
export function beforeCutoff(ms: number): string {
  const m = Math.round(ms / MIN)
  if (m < 90) return `${m} min before the cutoff`
  return `${span(ms)} before the cutoff`
}

export function km(n: number): string {
  return n < 1 ? `${Math.round(n * 1000)} m` : `${n.toFixed(1)} km`
}

export function kg(n: number): string {
  return `${Number.isInteger(n) ? n : n.toFixed(1)} kg`
}

export function meals(n: number): string {
  return `${n.toLocaleString('en-IN')} ${n === 1 ? 'meal' : 'meals'}`
}

export function day(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}

export function kindLabel(kind: Rescue['food']['kind']): string {
  switch (kind) {
    case 'veg':
      return 'Vegetarian'
    case 'nonveg':
      return 'Non-vegetarian'
    case 'bakery':
      return 'Bakery'
    default:
      return 'Mixed'
  }
}
