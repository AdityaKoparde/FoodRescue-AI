import { ArrowLeft, Check, Phone } from 'lucide-react'
import { useState } from 'react'
import { Countdown } from '../components/Countdown'
import { Link } from '../components/Link'
import { haversine } from '../lib/engine'
import { clock, kg, meals } from '../lib/format'
import { partnerById } from '../lib/partners'
import { useStore } from '../lib/store'

export function Accept({ id }: { id: string }) {
  const { rescues, simNow, accept, decline } = useStore()
  const [did, setDid] = useState<'accept' | 'decline' | null>(null)

  const rescue = rescues.find((r) => r.id === id)
  const partnerId = new URLSearchParams(window.location.search).get('p') ?? undefined

  if (!rescue) {
    return (
      <main className="mx-auto max-w-[440px] px-5 py-16">
        <h1 className="text-[26px]">This invite is not on this device</h1>
        <p className="mt-2 text-[13.5px]" style={{ color: 'var(--color-ink-2)' }}>
          The desk keeps its rescues locally in this demo, so a link only opens where the
          rescue was created. Open it in the browser you demoed from, or press Reset
          there and use a seeded invitation.
        </p>
        <Link to="/" className="btn mt-4">
          <ArrowLeft size={13} /> Back to the desk
        </Link>
      </main>
    )
  }

  const invited = rescue.broadcasts.filter((b) => b.status === 'sent')
  const partner =
    partnerById(partnerId) ??
    partnerById(rescue.assignee) ??
    partnerById(invited[0]?.partnerId) ??
    partnerById(rescue.broadcasts[0]?.partnerId)
  const distance = partner ? haversine(partner, rescue.donor) : 0
  const takenBy = partnerById(rescue.assignee)
  const mine = Boolean(partner && rescue.assignee === partner.id)
  const ownBroadcast = partner
    ? rescue.broadcasts.find((b) => b.partnerId === partner.id)
    : undefined
  const stale =
    ownBroadcast?.status === 'declined' ||
    ownBroadcast?.status === 'timed_out' ||
    ownBroadcast?.status === 'withdrawn'
  const closed = rescue.status === 'closed'
  const lost = rescue.status === 'expired'
  const open = !rescue.assignee && !lost && !closed && !stale

  const outcome = lost
    ? {
        title: 'This window has closed',
        body: `${rescue.food.meals} meals went unsold. The desk keeps a record of it.`,
      }
    : closed
      ? {
          title: mine ? 'You collected this rescue' : 'This rescue is complete',
          body: mine
            ? 'The signed receipt is on the rescue file.'
            : 'Nothing more is needed from you.',
        }
      : takenBy
        ? mine
          ? {
              title: 'You are the assigned partner',
              body: 'Bring the handover photo back to the desk and the receipt is issued.',
            }
          : {
              title: `Already taken by ${takenBy.name}`,
              body: 'Nothing more is needed from you.',
            }
        : stale
          ? {
              title: 'You already answered this invitation',
              body:
                ownBroadcast?.status === 'declined'
                  ? 'You declined it, so the desk stopped waiting. Nothing more is needed from you.'
                  : 'The desk stopped waiting on this one and moved on. Nothing more is needed from you.',
            }
          : {
              title: 'This invitation is closed',
              body: 'Nothing more is needed from you.',
            }

  return (
    <main className="mx-auto max-w-[460px] px-4 pb-14 pt-5">
      <div className="flex items-center justify-between">
        <Link to="/" className="label flex items-center gap-1.5">
          <ArrowLeft size={12} /> FoodRescue
        </Link>
        <span className="label">{rescue.code}</span>
      </div>

      <div className="ledger mt-3 p-4">
        <div className="label">Pickup invitation</div>
        <h1 className="mt-1 text-[30px] leading-[1.02]">{rescue.donor.name}</h1>
        <div className="text-[12.5px]" style={{ color: 'var(--color-ink-2)' }}>
          {rescue.donor.kind} · {rescue.donor.area}
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="label">Food</div>
            <div className="text-[14px] leading-snug">{rescue.food.title}</div>
            <div
              className="mt-1 font-mono tnum text-[12px]"
              style={{ color: 'var(--color-ink-2)' }}
            >
              {meals(rescue.food.meals)} · {kg(rescue.food.kg)}
            </div>
            {rescue.food.allergens.length > 0 && (
              <div className="mt-1 text-[11.5px]" style={{ color: 'var(--color-clay-ink)' }}>
                contains {rescue.food.allergens.join(', ')}
              </div>
            )}
          </div>
          <Countdown
            from={rescue.createdAt}
            safeUntil={rescue.food.safeUntil}
            now={simNow}
            size={62}
            showLabel
          />
        </div>

        <div
          className="mt-4 grid grid-cols-2 gap-px"
          style={{ background: 'var(--color-rule)' }}
        >
          <div className="px-3 py-2" style={{ background: 'var(--color-paper)' }}>
            <div className="label">Collect by</div>
            <div className="font-mono tnum text-[13px]">
              {clock(rescue.food.safeUntil)}
            </div>
          </div>
          <div className="px-3 py-2" style={{ background: 'var(--color-paper)' }}>
            <div className="label">From you</div>
            <div className="font-mono tnum text-[13px]">
              {distance < 1
                ? `${Math.round(distance * 1000)} m`
                : `${distance.toFixed(1)} km`}
            </div>
          </div>
        </div>

        {open && !did && (
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              className="btn btn-live w-full py-3"
              onClick={() => {
                accept(rescue.id, partner?.id)
                setDid('accept')
              }}
            >
              <Check size={15} strokeWidth={2.2} />
              We can collect this
            </button>
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => {
                decline(rescue.id, partner?.id)
                setDid('decline')
              }}
            >
              Not tonight
            </button>
            <p
              className="mt-1 text-[11px] leading-snug"
              style={{ color: 'var(--color-ink-3)' }}
            >
              Accepting is a commitment to collect before {clock(rescue.food.safeUntil)}.
              If you cannot make it, say no — the desk will keep looking.
            </p>
          </div>
        )}

        {did === 'accept' && (
          <div
            className="rise mt-4 p-3"
            style={{ background: '#e6f0c2', border: '1px solid #b6c97a' }}
          >
            <div className="text-[13.5px] font-medium" style={{ color: 'var(--color-live-ink)' }}>
              Pickup confirmed for {partner?.name}
            </div>
            <p className="mt-1 text-[12px] leading-snug">
              Other invitations were withdrawn. Take crates, ask for the night manager,
              and photograph the handover when you load up.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[12px]">
              <Phone size={12} /> 0821 24•• ••12
            </div>
            <Link
              to={`/rescue/${rescue.id}`}
              className="mt-3 inline-block text-[12px] underline decoration-dotted underline-offset-2"
            >
              Open the rescue file
            </Link>
          </div>
        )}

        {did === 'decline' && (
          <div className="rise mt-4 p-3" style={{ background: 'var(--color-paper-3)' }}>
            <div className="text-[13px] font-medium">Noted — thank you for saying so</div>
            <p className="mt-1 text-[12px] leading-snug">
              A decline in the first minutes is worth more than a silent phone. The desk
              has moved on to the next partner.
            </p>
          </div>
        )}

        {!open && !did && (
          <div className="mt-4 p-3" style={{ background: 'var(--color-paper-3)' }}>
            <div className="text-[13px] font-medium">{outcome.title}</div>
            <p className="mt-1 text-[12px] leading-snug">{outcome.body}</p>
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] leading-snug" style={{ color: 'var(--color-ink-3)' }}>
        Demo link. No account needed — this is exactly what a partner receives on
        WhatsApp.
      </p>
    </main>
  )
}
