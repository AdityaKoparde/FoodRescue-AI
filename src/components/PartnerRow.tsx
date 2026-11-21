import { ArrowUpRight } from 'lucide-react'
import { km } from '../lib/format'
import type { Partner, BroadcastStatus } from '../lib/types'
import { Link } from './Link'

const STATUS_LABEL: Record<BroadcastStatus, string> = {
  sent: 'Waiting',
  declined: 'Declined',
  timed_out: 'No answer',
  accepted: 'Accepted',
  withdrawn: 'Withdrawn',
}

const STATUS_COLOR: Record<BroadcastStatus, string> = {
  sent: 'var(--color-ink-3)',
  declined: 'var(--color-clay-ink)',
  timed_out: 'var(--color-ink-3)',
  accepted: 'var(--color-live-ink)',
  withdrawn: 'var(--color-ink-3)',
}

interface Props {
  rank: number
  partner: Partner
  distance: number
  likely: number
  status?: BroadcastStatus
  accepted: boolean
  inviteHref: string
  invited: boolean
}

export function PartnerRow({
  rank,
  partner,
  distance,
  likely,
  status,
  accepted,
  inviteHref,
  invited,
}: Props) {
  return (
    <div
      className="grid grid-cols-[20px_1fr_auto] items-center gap-3 py-2.5"
      style={{ borderTop: rank === 1 ? 'none' : '1px solid var(--color-rule)' }}
    >
      <span
        className="font-mono tnum text-[11px]"
        style={{ color: 'var(--color-ink-3)' }}
      >
        {String(rank).padStart(2, '0')}
      </span>

      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[13.5px] font-medium">{partner.name}</span>
          {accepted && (
            <span
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--color-live-ink)' }}
            >
              assigned
            </span>
          )}
        </div>
        <div
          className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px]"
          style={{ color: 'var(--color-ink-2)' }}
        >
          <span>{partner.area}</span>
          <span aria-hidden>·</span>
          <span className="font-mono tnum">{km(distance)}</span>
          <span aria-hidden>·</span>
          <span className="font-mono tnum">fits {partner.capacity}</span>
          {partner.verified && (
            <>
              <span aria-hidden>·</span>
              <span>verified</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {invited ? (
          <span
            className="font-mono text-[11px] uppercase tracking-[0.1em]"
            style={{ color: status ? STATUS_COLOR[status] : 'var(--color-ink-3)' }}
          >
            {status ? STATUS_LABEL[status] : '—'}
          </span>
        ) : (
          <span className="label">standby</span>
        )}
        <span
          className="font-mono tnum text-[12px]"
          title="Share of this partner's accepted pickups that actually arrived"
          style={{ color: 'var(--color-ink-2)' }}
        >
          {likely}%
        </span>
        <Link
          to={inviteHref}
          className="flex items-center gap-1 text-[11px] underline decoration-dotted underline-offset-2"
          style={{ color: 'var(--color-ink-2)' }}
          title={`Open the rescue link for ${partner.name}`}
        >
          link
          <ArrowUpRight size={11} strokeWidth={2} />
        </Link>
      </div>
    </div>
  )
}
