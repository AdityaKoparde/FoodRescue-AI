import { ArrowRight } from 'lucide-react'
import { Link } from '../components/Link'
import { metrics } from '../lib/engine'
import { day, kg, meals, span } from '../lib/format'
import { partnerById } from '../lib/partners'
import { useStore } from '../lib/store'

export function Impact() {
  const { rescues } = useStore()
  const m = metrics(rescues)
  const closed = rescues
    .filter((r) => r.status === 'closed' && r.handover)
    .sort((a, b) => (b.handover?.at ?? 0) - (a.handover?.at ?? 0))
  const expired = rescues.filter((r) => r.status === 'expired')
  const total = m.mealsRescued + m.lostMeals
  const share = total ? m.mealsRescued / total : 0

  return (
    <main className="mx-auto max-w-[1080px] px-5 pb-20 pt-6">
      <div className="label">Impact ledger · seeded day</div>
      <h1 className="mt-1 max-w-[22ch] text-[42px] leading-[1.02]">
        What the desk rescued, and what it lost
      </h1>
      <p
        className="mt-2 max-w-[58ch] text-[13.5px]"
        style={{ color: 'var(--color-ink-2)' }}
      >
        Both columns are on the record. A rescue rate that only counts the wins is a
        brochure, not an operating number.
      </p>

      <dl
        className="mt-7 grid gap-px sm:grid-cols-2 lg:grid-cols-4"
        style={{ background: 'var(--color-rule)' }}
      >
        {[
          ['Meals rescued', m.mealsRescued.toLocaleString('en-IN'), 'handed over and signed'],
          ['Weight diverted', kg(m.kgRescued), 'kept out of the bin'],
          [
            'Rescue rate',
            `${Math.round(m.rescueRate * 100)}%`,
            `${m.closedCount} closed · ${m.expiredCount} lost`,
          ],
          [
            'Average time to accept',
            m.avgAcceptMin ? span(m.avgAcceptMin * 60_000) : '—',
            'from listing to a yes',
          ],
        ].map(([label, value, note]) => (
          <div key={label} className="px-4 py-4" style={{ background: 'var(--color-paper-2)' }}>
            <dt className="label">{label}</dt>
            <dd className="mt-1 font-mono tnum text-[30px] leading-none">{value}</dd>
            <dd className="mt-1.5 text-[11.5px]" style={{ color: 'var(--color-ink-3)' }}>
              {note}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-9 grid items-start gap-10 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <h2 className="text-[24px]">Meals by outcome</h2>
          <div className="mt-3 flex h-3 w-full" style={{ border: '1px solid var(--color-rule-2)' }}>
            <div
              style={{
                width: `${share * 100}%`,
                background: 'var(--color-live)',
              }}
            />
            <div
              style={{
                width: `${(1 - share) * 100}%`,
                background: '#e5b7a9',
              }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11.5px]">
            <span>
              <span className="font-mono tnum">{m.mealsRescued}</span> rescued
            </span>
            <span style={{ color: 'var(--color-clay-ink)' }}>
              <span className="font-mono tnum">{m.lostMeals}</span> lost
            </span>
          </div>

          <div className="mt-7 ledger p-4">
            <div className="label">No-shows absorbed</div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-mono tnum text-[26px]">{m.savedAfterFlag}</span>
              <span className="text-[12.5px]" style={{ color: 'var(--color-ink-2)' }}>
                of {m.flaggedCount} rescues that hit a decline or a silent partner still
                ended in a handover
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
              This is the number the product exists for. Finding a willing NGO is easy.
              Keeping the promise after the first partner goes quiet is the part that
              decides whether a manager donates again.
            </p>
          </div>

          <h2 className="mt-8 text-[24px]">Signed receipts</h2>
          <div className="mt-2">
            <div
              className="grid grid-cols-[64px_1fr_88px_72px] gap-3 pb-1.5"
              style={{ borderBottom: '1px solid var(--color-rule-2)' }}
            >
              {['Date', 'Donor / partner', 'Portions', 'File'].map((h) => (
                <span key={h} className="label">
                  {h}
                </span>
              ))}
            </div>
            {closed.map((r) => (
              <Link
                key={r.id}
                to={`/rescue/${r.id}`}
                className="grid grid-cols-[64px_1fr_88px_72px] items-center gap-3 py-2.5"
                style={{ borderBottom: '1px solid var(--color-rule)' }}
              >
                <span className="font-mono tnum text-[11.5px]">
                  {day(r.handover?.at ?? r.createdAt)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px]">{r.donor.name}</span>
                  <span
                    className="block truncate text-[11.5px]"
                    style={{ color: 'var(--color-ink-2)' }}
                  >
                    → {r.handover?.receivedBy ?? partnerById(r.assignee)?.name}
                  </span>
                </span>
                <span className="font-mono tnum text-[12.5px]">
                  {r.handover?.meals ?? 0}
                </span>
                <span className="label underline decoration-dotted underline-offset-2">
                  open
                </span>
              </Link>
            ))}
            {closed.length === 0 && (
              <p className="py-3 text-[12.5px]" style={{ color: 'var(--color-ink-2)' }}>
                No handovers signed yet. Accept an invite from the desk, then sign the
                handover.
              </p>
            )}
          </div>

          {expired.length > 0 && (
            <>
              <h2 className="mt-8 text-[24px]">Losses on the record</h2>
              {expired.map((r) => (
                <div
                  key={r.id}
                  className="flex items-baseline justify-between gap-4 py-2.5"
                  style={{ borderBottom: '1px solid var(--color-rule)' }}
                >
                  <div>
                    <div className="text-[13px]">{r.donor.name}</div>
                    <div className="text-[11.5px]" style={{ color: 'var(--color-ink-2)' }}>
                      {r.food.title} · {meals(r.food.meals)} unsold
                    </div>
                  </div>
                  <Link
                    to={`/rescue/${r.id}`}
                    className="label underline decoration-dotted underline-offset-2"
                  >
                    why
                  </Link>
                </div>
              ))}
            </>
          )}
        </div>

        <aside className="ledger p-4">
          <h2 className="text-[22px]">What this is not</h2>
          <ul className="mt-2 space-y-2.5 text-[12.5px] leading-relaxed">
            <li>
              <span className="font-medium">Not a validated pilot.</span> No real canteen
              or NGO has used this yet. Partners and donors in the demo are synthetic and
              labelled as such.
            </li>
            <li>
              <span className="font-medium">Not a food-safety authority.</span> The cutoff
              comes from a written handling rule and the manager's confirmation. The model
              never declares food safe.
            </li>
            <li>
              <span className="font-medium">Not a marketplace claim.</span> The numbers on
              this page describe the seeded demo, not Mysuru.
            </li>
          </ul>

          <div className="hairline mt-4 pt-3">
            <div className="label">Next three validations</div>
            <ol className="mt-1.5 space-y-1.5 text-[12.5px] leading-snug">
              <li>1. Two weeks of listings with one college canteen, counting declines.</li>
              <li>2. Whether a partner accepts a WhatsApp link with no account.</li>
              <li>3. Whether a signed receipt changes whether the manager donates again.</li>
            </ol>
          </div>

          <Link to="/" className="btn mt-4 w-full">
            Back to the desk
            <ArrowRight size={13} strokeWidth={2} />
          </Link>
        </aside>
      </div>
    </main>
  )
}
