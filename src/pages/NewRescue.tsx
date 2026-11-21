import { Camera, Check, Loader2, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from '../components/Link'
import { rankPartners } from '../lib/engine'
import { clock, kg, meals } from '../lib/format'
import { navigate } from '../lib/router'
import { SAFETY_RULE, safeUntilFor } from '../lib/seed'
import { useStore } from '../lib/store'
import { DONORS } from '../lib/partners'
import type { Food } from '../lib/types'

const MIN = 60_000

function timeValue(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fromTime(value: string, base: number): number {
  const [h, m] = value.split(':').map(Number)
  const d = new Date(base)
  d.setHours(h || 0, m || 0, 0, 0)
  return d.getTime()
}

interface Guess {
  title: string
  kind: Food['kind']
  meals: number
  kg: number
  allergens: string[]
}

const RULE_GUESS: Guess = {
  title: 'Cooked meals — rice, sambar, vegetable palya',
  kind: 'veg',
  meals: 48,
  kg: 21,
  allergens: ['dairy'],
}

export function NewRescue() {
  const { simNow, createRescue } = useStore()
  const fileInput = useRef<HTMLInputElement>(null)

  const [donorIdx, setDonorIdx] = useState(0)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<Food['kind']>('veg')
  const [portions, setPortions] = useState('50')
  const [weight, setWeight] = useState('22')
  const [allergens, setAllergens] = useState('')
  const [prepTime, setPrepTime] = useState(timeValue(simNow - 30 * MIN))
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [reader, setReader] = useState<'idle' | 'vision' | 'rules'>('idle')

  const donor = DONORS[donorIdx]
  const preparedAt = fromTime(prepTime, simNow)
  const safeUntil = safeUntilFor(preparedAt, kind)
  const cutoffPassed = safeUntil <= simNow

  const mealsN = Math.max(0, Number(portions) || 0)
  const ranked = useMemo(
    () => rankPartners(donor, mealsN).filter((r) => r.km <= 5).slice(0, 3),
    [donor, mealsN],
  )

  function apply(g: Guess) {
    setTitle(g.title)
    setKind(g.kind)
    setPortions(String(g.meals))
    setWeight(String(g.kg))
    setAllergens(g.allergens.join(', '))
  }

  async function readPhoto(dataUrl: string) {
    setBusy(true)
    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
      if (!res.ok) throw new Error('vision unavailable')
      const data = (await res.json()) as Partial<Guess>
      if (!data.title || !data.meals) throw new Error('no reading')
      apply({
        title: data.title,
        kind: (data.kind as Food['kind']) ?? 'veg',
        meals: Number(data.meals),
        kg: Number(data.kg ?? 20),
        allergens: data.allergens ?? [],
      })
      setReader('vision')
    } catch {
      apply(RULE_GUESS)
      setReader('rules')
    } finally {
      setBusy(false)
    }
  }

  function onFile(file: File | undefined) {
    if (!file) return
    const fr = new FileReader()
    fr.onload = () => {
      const url = String(fr.result)
      setPhoto(url)
      void readPhoto(url)
    }
    fr.readAsDataURL(file)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || mealsN <= 0 || cutoffPassed) return
    const food: Food = {
      title: title.trim(),
      kind,
      meals: mealsN,
      kg: Math.max(0, Number(weight) || 0),
      allergens: allergens
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean),
      preparedAt,
      safeUntil,
    }
    const id = createRescue(donor, food, reader === 'vision' ? 'vision' : 'manual')
    navigate(`/rescue/${id}`)
  }

  const ruleHours = SAFETY_RULE[kind] / 60

  return (
    <main className="mx-auto max-w-[1120px] px-5 pb-16 pt-6">
      <div className="label">New rescue</div>
      <h1 className="mt-1 text-[34px]">Put surplus on the desk</h1>
      <p
        className="mt-1 max-w-[62ch] text-[13.5px]"
        style={{ color: 'var(--color-ink-2)' }}
      >
        A photo speeds up the paperwork. It never decides whether the food is safe —
        the safety window comes from a written rule and the manager confirms it.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-5 lg:grid-cols-[336px_1fr]">
        <div>
          <div className="ledger p-3">
            <label
              className="flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden text-center"
              style={{
                border: '1px dashed var(--color-rule-2)',
                background: 'var(--color-paper)',
              }}
            >
              {photo ? (
                <img
                  src={photo}
                  alt="Surplus food you are listing"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-6">
                  <Camera
                    size={22}
                    strokeWidth={1.5}
                    className="mx-auto"
                    style={{ color: 'var(--color-ink-2)' }}
                  />
                  <span className="mt-2 block text-[13px]">
                    Photograph the trays
                  </span>
                  <span
                    className="mt-1 block text-[11.5px]"
                    style={{ color: 'var(--color-ink-3)' }}
                  >
                    JPG or PNG, one shot is enough
                  </span>
                </span>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>

            <div className="mt-3 min-h-[58px]">
              {busy && (
                <p
                  className="flex items-center gap-2 text-[12px]"
                  style={{ color: 'var(--color-ink-2)' }}
                >
                  <Loader2 size={13} className="animate-spin" />
                  Reading the photo…
                </p>
              )}
              {!busy && reader === 'vision' && (
                <p
                  className="flex items-start gap-2 text-[12px] leading-snug"
                  style={{ color: 'var(--color-live-ink)' }}
                >
                  <Check size={13} className="mt-[3px] shrink-0" />
                  Read by the vision model. Check every field before it goes out.
                </p>
              )}
              {!busy && reader === 'rules' && (
                <p
                  className="text-[12px] leading-snug"
                  style={{ color: 'var(--color-ink-2)' }}
                >
                  Vision service is not configured, so the desk filled a typical listing
                  from the house rules. Nothing is blocked.
                </p>
              )}
              {!busy && reader === 'idle' && (
                <p className="text-[12px] leading-snug" style={{ color: 'var(--color-ink-3)' }}>
                  No photo? Fill the fields in by hand — the desk works either way.
                </p>
              )}
            </div>
          </div>

          <div className="ledger mt-4 p-3.5">
            <div className="flex items-center gap-2">
              <Sparkles size={13} strokeWidth={1.8} />
              <span className="label">Safety window</span>
            </div>
            <div className="mt-2 font-mono tnum text-[20px]">{clock(safeUntil)}</div>
            <p
              className="mt-0.5 text-[11.5px] leading-snug"
              style={{ color: 'var(--color-ink-2)' }}
            >
              {ruleHours}h from preparation for{' '}
              {kind === 'nonveg' ? 'non-vegetarian' : kind} food. Written rule, not a
              model guess.
            </p>
            {cutoffPassed && (
              <p
                className="mt-2 text-[11.5px] font-medium"
                style={{ color: 'var(--color-clay-ink)' }}
              >
                That cutoff has passed. Move the preparation time forward.
              </p>
            )}
          </div>
        </div>

        <div className="ledger p-4">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label">Donor</span>
              <select
                className="field mt-1"
                value={donorIdx}
                onChange={(e) => setDonorIdx(Number(e.target.value))}
              >
                {DONORS.map((d, i) => (
                  <option key={d.name} value={i}>
                    {d.name} — {d.area}
                  </option>
                ))}
              </select>
            </label>

            <label className="sm:col-span-2">
              <span className="label">What is left over</span>
              <input
                className="field mt-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Veg thali — rice, sambar, palya"
              />
            </label>

            <label>
              <span className="label">Food type</span>
              <select
                className="field mt-1"
                value={kind}
                onChange={(e) => setKind(e.target.value as Food['kind'])}
              >
                <option value="veg">Vegetarian</option>
                <option value="nonveg">Non-vegetarian</option>
                <option value="bakery">Bakery</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>

            <label>
              <span className="label">Prepared at</span>
              <input
                type="time"
                className="field mt-1"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
              />
            </label>

            <label>
              <span className="label">Portions</span>
              <input
                type="number"
                min={1}
                className="field mt-1 font-mono tnum"
                value={portions}
                onChange={(e) => setPortions(e.target.value)}
              />
            </label>

            <label>
              <span className="label">Approx. weight (kg)</span>
              <input
                type="number"
                min={0}
                step="0.1"
                className="field mt-1 font-mono tnum"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </label>

            <label className="sm:col-span-2">
              <span className="label">Allergens</span>
              <input
                className="field mt-1"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                placeholder="dairy, nuts, gluten — comma separated"
              />
            </label>
          </div>

          <div
            className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3"
            style={{
              background: 'var(--color-paper-3)',
              border: '1px solid var(--color-rule)',
            }}
          >
            <div className="text-[12.5px]">
              <div className="label">On broadcast</div>
              <div className="mt-0.5">
                {meals(mealsN)} · {kg(Number(weight) || 0)} → {ranked.length} partners
                within 5 km
              </div>
            </div>
            <button type="submit" className="btn btn-live" disabled={!title.trim() || mealsN <= 0 || cutoffPassed}>
              Broadcast to partners
            </button>
          </div>

          <p className="mt-3 text-[11.5px] leading-snug" style={{ color: 'var(--color-ink-3)' }}>
            Escalation runs on the desk clock: 5 min for the first decline, 12 min for a
            silent partner, 18 min to widen the radius, 26 min for a standby to take it.
          </p>
          {!title.trim() && (
            <p className="mt-1 text-[11.5px]" style={{ color: 'var(--color-ink-2)' }}>
              Add what is left over to enable the broadcast.
            </p>
          )}
          <Link
            to="/"
            className="mt-2 inline-block text-[11.5px] underline decoration-dotted underline-offset-2"
          >
            Back to the desk
          </Link>
        </div>
      </form>
    </main>
  )
}
