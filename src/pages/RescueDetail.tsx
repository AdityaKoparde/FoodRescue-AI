import { ArrowLeft, ArrowUpRight, FileCheck2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Countdown } from '../components/Countdown'
import { Link } from '../components/Link'
import { PartnerRow } from '../components/PartnerRow'
import { StatusPill } from '../components/StatusPill'
import { Timeline } from '../components/Timeline'
import { rankPartners } from '../lib/engine'
import { clock, clockSec, day, kg, kindLabel, meals, remaining } from '../lib/format'
import { partnerById } from '../lib/partners'
import { useStore } from '../lib/store'
import type { Rescue } from '../lib/types'

function proofId(r: Rescue): string {
  const seed = `${r.code}:${r.handover?.at ?? 0}`
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `PRF-${(h >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 8)}`
}

function Receipt({ rescue }: { rescue: Rescue }) {
  const h = rescue.handover
  if (!h) return null
  return (
    <div
      className="mt-4 p-4"
      style={{ background: 'var(--color-paper)', border: '1px solid var(--color-ink)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="label">Proof of rescue</div>
          <div className="mt-0.5 font-mono text-[13px]">{proofId(rescue)}</div>
        </div>
        <FileCheck2 size={16} strokeWidth={1.6} />
      </div>
      <div
        className="mt-3 grid gap-y-1.5 pt-3 text-[12.5px]"
        style={{ borderTop: '1px dashed var(--color-rule-2)' }}
      >
        {[
          ['Donor', rescue.donor.name],
          ['Received by', h.receivedBy],
          ['Portions', meals(h.meals)],
          ['Weight', kg(h.kg)],
          ['Handed over', `${day(h.at)} ${clockSec(h.at)}`],
          ['Safe window', `closed ${clock(rescue.food.safeUntil)}`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span style={{ color: 'var(--color-ink-2)' }}>{k}</span>
            <span className="text-right font-mono tnum">{v}</span>
          </div>
        ))}
      </div>
      {h.note && (
        <p
          className="mt-3 text-[12px] leading-snug"
          style={{ color: 'var(--color-ink-2)' }}
        >
          “{h.note}”
        </p>
      )}
      <p className="mt-2 text-[10.5px]" style={{ color: 'var(--color-ink-3)' }}>
        Timestamped at the desk. This is the record the donor keeps — and the reason a
        manager says yes again next week.
      </p>
    </div>
  )
}

export function RescueDetail({ id }: { id: string }) {
  const { rescues, simNow, handover } = useStore()
  const rescue = rescues.find((r) => r.id === id)
  const [receivedBy, setReceivedBy] = useState('')
  const [count, setCount] = useState('')
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')

  const ranked = useMemo(
    () => (rescue ? rankPartners(rescue.donor, rescue.food.meals) : []),
    [rescue],
  )

  if (!rescue) {
    return (
      <main className="mx-auto max-w-[560px] px-5 py-16">
        <h1 className="text-[26px]">Rescue not found</h1>
        <p className="mt-2 text-[13.5px]" style={{ color: 'var(--color-ink-2)' }}>
          This file is not on the desk. It may have been cleared by a reset.
        </p>
        <Link to="/" className="btn mt-4">
          <ArrowLeft size={13} /> Back to the desk
        </Link>
      </main>
    )
  }

  const assignee = partnerById(rescue.assignee)
  const canSign = rescue.status === 'accepted'
  const mealsValue = count === '' ? rescue.food.meals : Number(count)
  const kgValue = weight === '' ? rescue.food.kg : Number(weight)

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-16 pt-5">
      <Link to="/" className="label flex items-center gap-1.5">
        <ArrowLeft size={12} /> Rescue desk
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="label">{rescue.code}</span>
            <StatusPill status={rescue.status} />
            <span className="label">{rescue.source === 'vision' ? 'from photo' : 'entered by hand'}</span>
          </div>
          <h1 className="mt-1 text-[34px] leading-none">{rescue.donor.name}</h1>
          <div className="mt-1 text-[12.5px]" style={{ color: 'var(--color-ink-2)' }}>
            {rescue.donor.kind} · {rescue.donor.area} · opened {clock(rescue.createdAt)}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Countdown
            from={rescue.createdAt}
            safeUntil={rescue.food.safeUntil}
            now={simNow}
            size={56}
            showLabel
          />
        </div>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.12fr_0.88fr]">
        <div>
          <div className="ledger p-4">
            <div className="label">The rescue</div>
            <h2 className="mt-0.5 text-[23px]">{rescue.food.title}</h2>
            <div className="mt-3 grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: 'var(--color-rule)' }}>
              {[
                ['Portions', meals(rescue.food.meals)],
                ['Weight', kg(rescue.food.kg)],
                ['Food type', kindLabel(rescue.food.kind)],
                ['Cutoff', clock(rescue.food.safeUntil)],
              ].map(([k, v]) => (
                <div key={k} className="px-3 py-2" style={{ background: 'var(--color-paper)' }}>
                  <div className="label">{k}</div>
                  <div className="mt-0.5 text-[12.5px]">{v}</div>
                </div>
              ))}
            </div>
            {rescue.food.allergens.length > 0 && (
              <p className="mt-2 text-[11.5px]" style={{ color: 'var(--color-clay-ink)' }}>
                Allergens declared: {rescue.food.allergens.join(', ')}
              </p>
            )}
            {rescue.assignee && (
              <p className="mt-2 text-[12.5px]">
                Assigned to{' '}
                <span className="font-medium">{assignee?.name ?? 'partner'}</span>
                {rescue.acceptedAt
                  ? ` · accepted ${clock(rescue.acceptedAt)}`
                  : ''}
              </p>
            )}
          </div>

          <div className="ledger mt-4 p-4">
            <div className="flex items-baseline justify-between">
              <span className="label">What the desk did</span>
              <span className="label">
                {remaining(rescue.food.safeUntil, simNow) === 'past cutoff'
                  ? 'window closed'
                  : `${remaining(rescue.food.safeUntil, simNow)} left`}
              </span>
            </div>
            <div className="mt-1">
              <Timeline events={rescue.events} now={simNow} />
            </div>
          </div>

          {canSign && (
            <form
              className="ledger mt-4 p-4"
              onSubmit={(e) => {
                e.preventDefault()
                handover(rescue.id, {
                  receivedBy: receivedBy || assignee?.name || 'Partner',
                  meals: Math.max(0, mealsValue),
                  kg: Math.max(0, kgValue),
                  note: note.trim(),
                })
              }}
            >
              <div className="label">Handover</div>
              <h2 className="mt-0.5 text-[22px]">Sign the food over</h2>
              <p className="mt-1 text-[12px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
                Count the portions at the door. The receipt is what the donor keeps.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="label">Received by</span>
                  <input
                    className="field mt-1"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    placeholder={assignee?.name ?? 'Volunteer name'}
                  />
                </label>
                <label>
                  <span className="label">Portions handed over</span>
                  <input
                    className="field mt-1 font-mono tnum"
                    inputMode="numeric"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    placeholder={String(rescue.food.meals)}
                  />
                </label>
                <label>
                  <span className="label">Weight (kg)</span>
                  <input
                    className="field mt-1 font-mono tnum"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={String(rescue.food.kg)}
                  />
                </label>
                <label>
                  <span className="label">Note for the record</span>
                  <input
                    className="field mt-1"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Collected in two crates"
                  />
                </label>
              </div>
              <button type="submit" className="btn mt-3">
                Sign handover
              </button>
            </form>
          )}

          {rescue.status === 'closed' && <Receipt rescue={rescue} />}

          {rescue.status === 'expired' && (
            <div
              className="mt-4 p-4"
              style={{ background: '#f0cfc5', border: '1px solid #cf9a8b' }}
            >
              <div className="label" style={{ color: 'var(--color-clay-ink)' }}>
                Loss record
              </div>
              <h2 className="mt-0.5 text-[22px]" style={{ color: 'var(--color-clay-ink)' }}>
                {meals(rescue.food.meals)} went unsold
              </h2>
              <p className="mt-1 text-[12.5px] leading-snug">
                Every partner in range either declined or never answered. The desk keeps
                this on the ledger instead of hiding it — a rescue rate you cannot audit
                is marketing.
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="ledger p-4">
            <div className="flex items-baseline justify-between">
              <span className="label">Invited partners</span>
              <span className="label">{rescue.matchRadiusKm} km radius</span>
            </div>
            <div className="mt-1">
              {ranked.slice(0, 4).map((r, i) => {
                const b = rescue.broadcasts.find((x) => x.partnerId === r.partner.id)
                return (
                  <PartnerRow
                    key={r.partner.id}
                    rank={i + 1}
                    partner={r.partner}
                    distance={r.km}
                    likely={r.likely}
                    status={b?.status}
                    invited={Boolean(b)}
                    accepted={rescue.assignee === r.partner.id}
                    inviteHref={`/accept/${rescue.id}?p=${r.partner.id}`}
                  />
                )
              })}
            </div>
          </div>

          <div className="ledger mt-4 p-4">
            <div className="label">Partner view</div>
            <p className="mt-1 text-[12.5px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
              The same rescue as a volunteer sees it on their phone. No account, one
              link, two buttons.
            </p>
            <Link to={`/accept/${rescue.id}`} className="btn btn-ghost mt-3 w-full">
              Open the invite
              <ArrowUpRight size={13} strokeWidth={2} />
            </Link>
          </div>

          <div className="ledger mt-4 p-4">
            <div className="label">Why this file exists</div>
            <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
              Most surplus food is not lost because nobody wanted it. It is lost because
              a partner said yes and never arrived. This desk treats a silent phone as a
              scheduled event, not a surprise.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
