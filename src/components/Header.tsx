import { RotateCcw } from 'lucide-react'
import { clock, clockSec } from '../lib/format'
import { usePath } from '../lib/router'
import { useStore } from '../lib/store'
import { Link } from './Link'

const SPEEDS = [1, 60, 300]

export function Header() {
  const { simNow, speed, setSpeed, reset } = useStore()
  const path = usePath()
  const speedHint =
    speed === 1
      ? 'real time'
      : speed === 60
        ? 'one sim-minute per second'
        : 'five sim-minutes per second'

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{ background: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-7 gap-y-3 px-5 py-2.5">
        <Link to="/" className="flex items-center gap-2.5">
          <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden>
            <rect width="32" height="32" fill="var(--color-ink)" />
            <path
              d="M8 12h11a5 5 0 0 1 0 10H11"
              fill="none"
              stroke="var(--color-live)"
              strokeWidth="2.6"
            />
            <path
              d="M12 8l-4 4 4 4"
              fill="none"
              stroke="var(--color-live)"
              strokeWidth="2.6"
            />
          </svg>
          <span
            className="text-[20px] leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            FoodRescue
          </span>
          <span className="label mb-[1px] self-end">AI</span>
        </Link>

        <nav className="flex items-center gap-5 text-[13px]">
          <Link
            to="/"
            className="pb-0.5"
            style={{
              borderBottom:
                path === '/' || path.startsWith('/rescue')
                  ? '2px solid var(--color-ink)'
                  : '2px solid transparent',
            }}
          >
            Rescue desk
          </Link>
          <Link
            to="/impact"
            className="pb-0.5"
            style={{
              borderBottom:
                path === '/impact'
                  ? '2px solid var(--color-ink)'
                  : '2px solid transparent',
            }}
          >
            Impact ledger
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-5">
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <div className="label">Desk clock</div>
              <div className="font-mono tnum text-[15px] leading-tight">
                {clockSec(simNow)}
              </div>
            </div>
            <div
              className="seg"
              role="group"
              aria-label={`Demo clock speed, ${speedHint}`}
              title={`Demo clock — ${speedHint}. Accelerates the safe-eating window so a 90-minute rescue plays in 90 seconds.`}
            >
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  data-on={speed === s}
                  onClick={() => setSpeed(s)}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={reset}
            className="btn btn-ghost"
            title="Restore the seeded demo rescues"
          >
            <RotateCcw size={13} strokeWidth={1.8} />
            <span className="hidden md:inline">Reset</span>
          </button>

          <Link to="/new" className="btn">
            New rescue
          </Link>
        </div>
      </div>
      <div
        className="mx-auto max-w-[1440px] px-5 pb-2 text-[11px]"
        style={{ color: 'var(--color-ink-3)' }}
      >
        Seeded demo — partners and donors are synthetic. Desk clock at{' '}
        {clock(simNow)}.
      </div>
    </header>
  )
}
