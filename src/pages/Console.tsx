import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Countdown } from '../components/Countdown'
import { Link } from '../components/Link'
import { MapView } from '../components/MapView'
import { PartnerRow } from '../components/PartnerRow'
import { StatusPill } from '../components/StatusPill'
import { ARC, metrics, rankPartners } from '../lib/engine'
import { clock, kg, kindLabel, meals, remaining } from '../lib/format'
import { useStore } from '../lib/store'

const LADDER = [
  { at: ARC.decline, label: 'first decline' },
  { at: ARC.timeout, label: 'no answer' },
  { at: ARC.widen, label: 'radius widens' },
  { at: ARC.autoAccept, label: 'standby takes it' },
]

export function Console() {
  const { rescues, simNow, speed, setSpeed } = useStore()
  const [picked, setPicked] = useState<string | null>(null)

  const active = useMemo(
    () =>
      rescues
        .filter((r) => r.status !== 'closed' && r.status !== 'expired')
        .sort((a, b) => a.food.safeUntil - b.food.safeUntil),
    [rescues],
  )

  const selected = active.find((r) => r.id === picked) ?? active[0]
  const settled = useMemo(
    () =>
      rescues
        .filter((r) => r.status === 'closed' || r.status === 'expired')
        .sort(
          (a, b) =>
            (b.handover?.at ?? b.food.safeUntil) -
            (a.handover?.at ?? a.food.safeUntil),
        )
        .slice(0, 3),
    [rescues],
  )
  const ranked = useMemo(
    () => (selected ? rankPartners(selected.donor, selected.food.meals) : []),
    [selected],
  )
  const m = metrics(rescues)

  return (
    <main className="mx-auto max-w-[1440px] px-5 pb-16 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label">Mysuru · 6 partners · seeded demo</div>
          <h1 className="mt-1 text-[38px]">Rescue desk</h1>
          <p
            className="mt-1 max-w-[54ch] text-[13.5px]"
            style={{ color: 'var(--color-ink-2)' }}
          >
            Every donation runs against a safe-eating clock. If nobody answers, the
            desk widens the search instead of letting the food rot.
          </p>
        </div>
        <div className="flex items-end gap-6">
          <dl className="flex gap-7">
            <div>
              <dt className="label">Live</dt>
              <dd className="font-mono tnum text-[24px]">{active.length}</dd>
            </div>
            <div>
              <dt className="label">Meals rescued</dt>
              <dd className="font-mono tnum text-[24px]">{m.mealsRescued}</dd>
            </div>
            <div>
              <dt className="label">Meals lost</dt>
              <dd
                className="font-mono tnum text-[24px]"
                style={{ color: 'var(--color-clay-ink)' }}
              >
                {m.lostMeals}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setSpeed(speed === 1 ? 60 : 1)}
            title="Run the safe-eating window at 60× so a 90-minute rescue plays in 90 seconds"
          >
            {speed === 1 ? 'Play the day at 60×' : 'Back to real time'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,372px)_minmax(0,1fr)]">
        <section aria-label="Live rescues">
          <div
            className="flex items-center justify-between pb-2"
            style={{ borderBottom: '1px solid var(--color-rule)' }}
          >
            <span className="label">Open rescues</span>
            <span className="label">sorted by cutoff</span>
          </div>

          {active.length === 0 && (
            <div className="ledger mt-3 p-4">
              <p className="text-[13.5px]">Nothing open right now.</p>
              <p
                className="mt-1 text-[12.5px]"
                style={{ color: 'var(--color-ink-2)' }}
              >
                Every rescue is either signed off or lost. Press Reset in the header to
                put the seeded day back.
              </p>
              <Link to="/new" className="btn mt-3 w-full">
                Start a rescue
              </Link>
            </div>
          )}

          <ul className="mt-1">
            {active.map((r) => {
              const on = selected?.id === r.id
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(r.id)}
                    aria-current={on}
                    className="w-full px-3 py-3 text-left transition-colors"
                    style={{
                      borderLeft: `3px solid ${on ? 'var(--color-ink)' : 'transparent'}`,
                      background: on ? 'var(--color-paper-3)' : 'transparent',
                      borderBottom: '1px solid var(--color-rule)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="label">{r.code}</span>
                          <StatusPill status={r.status} />
                        </div>
                        <div className="mt-1 truncate text-[13.5px] font-medium">
                          {r.donor.name}
                        </div>
                        <div
                          className="mt-0.5 font-mono tnum text-[11.5px]"
                          style={{ color: 'var(--color-ink-2)' }}
                        >
                          {meals(r.food.meals)} · {kg(r.food.kg)} ·{' '}
                          {kindLabel(r.food.kind).toLowerCase()}
                        </div>
                      </div>
                      <Countdown
                        from={r.createdAt}
                        safeUntil={r.food.safeUntil}
                        now={simNow}
                        size={40}
                      />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="ledger mt-4 p-3.5">
            <div className="label">Escalation ladder</div>
            <ol className="mt-2 space-y-1.5">
              {LADDER.map((s) => (
                <li
                  key={s.at}
                  className="flex items-center gap-2 text-[12px]"
                  style={{ color: 'var(--color-ink-2)' }}
                >
                  <span className="font-mono tnum w-8 shrink-0">{s.at}m</span>
                  <span
                    aria-hidden
                    className="h-px flex-1"
                    style={{ background: 'var(--color-rule-2)' }}
                  />
                  <span>{s.label}</span>
                </li>
              ))}
            </ol>
            <p
              className="mt-2 text-[11px] leading-snug"
              style={{ color: 'var(--color-ink-3)' }}
            >
              Set by rule, not by a model. The clock is the only thing that can force a
              decision.
            </p>
          </div>

          {settled.length > 0 && (
            <div className="mt-5">
              <div
                className="flex items-center justify-between pb-1.5"
                style={{ borderBottom: '1px solid var(--color-rule-2)' }}
              >
                <span className="label">Settled</span>
                <Link
                  to="/impact"
                  className="label underline decoration-dotted underline-offset-2"
                >
                  ledger
                </Link>
              </div>
              {settled.map((r) => (
                <Link
                  key={r.id}
                  to={`/rescue/${r.id}`}
                  className="flex items-center justify-between gap-3 py-2"
                  style={{ borderBottom: '1px solid var(--color-rule)' }}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="label">{r.code}</span>
                      <StatusPill status={r.status} />
                    </span>
                    <span className="mt-1 block truncate text-[12.5px]">
                      {r.donor.name}
                    </span>
                  </span>
                  <span
                    className="shrink-0 font-mono tnum text-[11.5px]"
                    style={{ color: 'var(--color-ink-3)' }}
                  >
                    {r.status === 'closed'
                      ? `${r.handover?.meals ?? 0} meals`
                      : `${r.food.meals} lost`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {selected ? (
          <section className="min-w-0" aria-label="Selected rescue">
            <div className="ledger">
              <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="label">{selected.code}</span>
                    <StatusPill status={selected.status} />
                  </div>
                  <h2 className="mt-1 truncate text-[26px]">{selected.donor.name}</h2>
                  <div
                    className="text-[12.5px]"
                    style={{ color: 'var(--color-ink-2)' }}
                  >
                    {selected.donor.kind} · {selected.donor.area} · listed{' '}
                    {clock(selected.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="label">Safe until</div>
                  <div className="font-mono tnum text-[15px]">
                    {clock(selected.food.safeUntil)}
                  </div>
                  <div
                    className="font-mono tnum text-[12px]"
                    style={{ color: 'var(--color-ink-3)' }}
                  >
                    {remaining(selected.food.safeUntil, simNow) === 'past cutoff'
                      ? 'window closed'
                      : `${remaining(selected.food.safeUntil, simNow)} left`}
                  </div>
                </div>
              </div>

              <div
                className="grid grid-cols-2 gap-px sm:grid-cols-4"
                style={{ background: 'var(--color-rule)' }}
              >
                {[
                  ['Food', selected.food.title],
                  ['Portions', meals(selected.food.meals)],
                  ['Weight', kg(selected.food.kg)],
                  ['Allergens', selected.food.allergens.join(', ') || 'none declared'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="px-4 py-3"
                    style={{ background: 'var(--color-paper-2)' }}
                  >
                    <div className="label">{k}</div>
                    <div className="mt-0.5 text-[12.5px] leading-snug">{v}</div>
                  </div>
                ))}
              </div>

              <div className="h-[330px] w-full">
                <MapView rescue={selected} ranked={ranked} />
              </div>

              <div className="px-4 pb-1 pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="label">Partner ranking</span>
                  <span className="label">
                    {selected.broadcasts.length} invited · radius{' '}
                    {selected.matchRadiusKm} km
                  </span>
                </div>
                <div>
                  {ranked.slice(0, 4).map((r, i) => {
                    const b = selected.broadcasts.find(
                      (x) => x.partnerId === r.partner.id,
                    )
                    return (
                      <PartnerRow
                        key={r.partner.id}
                        rank={i + 1}
                        partner={r.partner}
                        distance={r.km}
                        likely={r.likely}
                        status={b?.status}
                        accepted={selected.assignee === r.partner.id}
                        invited={Boolean(b)}
                        inviteHref={`/accept/${selected.id}?p=${r.partner.id}`}
                      />
                    )
                  })}
                </div>
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-3 p-4"
                style={{ borderTop: '1px solid var(--color-rule)' }}
              >
                <p
                  className="max-w-[46ch] text-[11.5px] leading-snug"
                  style={{ color: 'var(--color-ink-3)' }}
                >
                  Partner links need no account. A volunteer opens one, accepts, and the
                  desk stops escalating.
                </p>
                <div className="flex gap-2">
                  <Link
                    to={`/accept/${selected.id}${
                      selected.broadcasts.find((b) => b.status === 'sent')
                        ? `?p=${selected.broadcasts.find((b) => b.status === 'sent')?.partnerId}`
                        : ''
                    }`}
                    className="btn btn-ghost"
                  >
                    Open partner link
                    <ArrowUpRight size={13} strokeWidth={2} />
                  </Link>
                  <Link to={`/rescue/${selected.id}`} className="btn">
                    Rescue file
                    <ArrowRight size={13} strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="ledger p-8">
            <h2 className="text-[26px]">The desk is clear</h2>
            <p
              className="mt-2 max-w-[44ch] text-[13.5px]"
              style={{ color: 'var(--color-ink-2)' }}
            >
              Nothing is waiting on an answer. Create a listing and the desk will rank
              partners, start a clock and escalate on its own.
            </p>
            <Link to="/new" className="btn mt-4">
              Start a rescue
            </Link>
          </section>
        )}
      </div>
    </main>
  )
}
