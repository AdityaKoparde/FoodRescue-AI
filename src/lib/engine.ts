import { PARTNERS, partnerById } from './partners'
import { beforeCutoff } from './format'
import type {
  Broadcast,
  Donor,
  Food,
  Handover,
  Rescue,
  RescueEvent,
} from './types'

const MIN = 60_000

/** escalation schedule, in minutes after the listing goes live */
export const ARC = {
  decline: 5,
  timeout: 12,
  widen: 18,
  autoAccept: 26,
} as const

export const BASE_RADIUS = 5
export const WIDE_RADIUS = 9

export interface Ranked {
  partner: (typeof PARTNERS)[number]
  km: number
  score: number
  likely: number
}

export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function rankPartners(donor: Donor, meals: number): Ranked[] {
  return PARTNERS.map((partner) => {
    const dist = haversine(donor, partner)
    const proximity = Math.max(0, 1 - dist / WIDE_RADIUS)
    const fit = Math.min(1, partner.capacity / Math.max(1, meals))
    const score = partner.reliability * 0.52 + proximity * 0.3 + fit * 0.18
    const likely = Math.round(
      Math.min(0.97, partner.reliability * 0.75 + proximity * 0.25) * 100,
    )
    return { partner, km: dist, score, likely }
  }).sort((a, b) => b.score - a.score)
}

function event(at: number, kind: RescueEvent['kind'], text: string): RescueEvent {
  return { at, kind, text }
}

export function makeRescue(input: {
  donor: Donor
  food: Food
  now: number
  source: Rescue['source']
  code: string
}): Rescue {
  const { donor, food, now, source, code } = input
  const ranked = rankPartners(donor, food.meals).filter(
    (r) => r.km <= BASE_RADIUS,
  )
  const picked = ranked.slice(0, 3)
  const broadcasts: Broadcast[] = picked.map((r) => ({
    partnerId: r.partner.id,
    at: now,
    channel: 'link',
    status: 'sent',
  }))

  const events: RescueEvent[] = [
    event(
      now,
      'system',
      source === 'vision'
        ? `Listing drafted from photo — ${food.title.toLowerCase()}`
        : `Listing entered by hand — ${food.title.toLowerCase()}`,
    ),
    event(
      now,
      'system',
      `Broadcast to ${broadcasts.length} partners within ${BASE_RADIUS.toFixed(1)} km`,
    ),
  ]

  return {
    id: code.toLowerCase(),
    code,
    donor,
    food,
    status: 'broadcast',
    createdAt: now,
    windowMin: Math.round((food.safeUntil - now) / MIN),
    matchRadiusKm: BASE_RADIUS,
    broadcasts,
    events,
    source,
  }
}

const DECLINE_NOTES = [
  'kitchen already at capacity tonight',
  'no vehicle free before the cutoff',
  'only two volunteers on shift today',
]

export function tickRescue(r: Rescue, now: number): Rescue {
  if (r.status === 'closed' || r.status === 'expired') return r

  let next = r
  const elapsed = (now - r.createdAt) / MIN

  const add = (at: number, kind: RescueEvent['kind'], text: string) => {
    next = { ...next, events: [...next.events, event(at, kind, text)] }
  }

  const setBroadcast = (
    partnerId: string,
    patch: Partial<Broadcast>,
  ): void => {
    next = {
      ...next,
      broadcasts: next.broadcasts.map((b) =>
        b.partnerId === partnerId ? { ...b, ...patch } : b,
      ),
    }
  }

  const pending = (partnerId: string) =>
    next.broadcasts.find((b) => b.partnerId === partnerId)?.status === 'sent'

  // 1. first partner declines
  const first = next.broadcasts[0]
  if (first && pending(first.partnerId) && elapsed >= ARC.decline) {
    const p = partnerById(first.partnerId)
    setBroadcast(first.partnerId, {
      status: 'declined',
      note: DECLINE_NOTES[0],
    })
    add(
      next.createdAt + ARC.decline * MIN,
      'partner',
      `${p?.name ?? 'Partner'} declined — ${DECLINE_NOTES[0]}`,
    )
  }

  // 2. second partner never answers
  const second = next.broadcasts[1]
  if (second && pending(second.partnerId) && elapsed >= ARC.timeout) {
    const p = partnerById(second.partnerId)
    setBroadcast(second.partnerId, { status: 'timed_out' })
    add(
      next.createdAt + ARC.timeout * MIN,
      'partner',
      `${p?.name ?? 'Partner'} did not answer within ${p?.respondMin ?? 9} min`,
    )
  }

  // 3. widen the radius and add a standby partner who can actually cover the load
  if (next.matchRadiusKm < WIDE_RADIUS && elapsed >= ARC.widen) {
    const taken = new Set(next.broadcasts.map((b) => b.partnerId))
    const needed = Math.ceil(next.food.meals * 0.75)
    const at = next.createdAt + ARC.widen * MIN
    const feasible = (next.food.safeUntil - at) / MIN >= 15
    const standby = feasible
      ? rankPartners(next.donor, next.food.meals).find(
          (cand) =>
            !taken.has(cand.partner.id) &&
            cand.km <= WIDE_RADIUS &&
            cand.partner.capacity >= needed,
        )
      : undefined
    next = {
      ...next,
      matchRadiusKm: WIDE_RADIUS,
      status: 'escalated',
      broadcasts: standby
        ? [
            ...next.broadcasts,
            {
              partnerId: standby.partner.id,
              at,
              channel: 'link',
              status: 'sent',
            },
          ]
        : next.broadcasts,
    }
    add(
      at,
      'system',
      standby
        ? `Radius widened to ${WIDE_RADIUS} km — standby ${standby.partner.name} added`
        : feasible
          ? `Radius widened to ${WIDE_RADIUS} km — no standby can cover ${next.food.meals} portions`
          : `No partner can reach ${next.donor.area} before the cutoff — the desk stops promising`,
    )
  }

  // 4. the standby takes it, if no human has answered and the pickup is still feasible
  if (
    next.status !== 'accepted' &&
    elapsed >= ARC.autoAccept &&
    next.broadcasts.length > 3 &&
    (next.food.safeUntil - (next.createdAt + ARC.autoAccept * MIN)) / MIN >= 15
  ) {
    const standby = next.broadcasts[3]
    if (standby && standby.status === 'sent') {
      const p = partnerById(standby.partnerId)
      setBroadcast(standby.partnerId, { status: 'accepted' })
      const at = next.createdAt + ARC.autoAccept * MIN
      next = {
        ...next,
        status: 'accepted',
        assignee: standby.partnerId,
        acceptedAt: at,
      }
      add(
        at,
        'system',
        `${p?.name ?? 'Standby partner'} accepted from standby — ${beforeCutoff(
          next.food.safeUntil - at,
        )}`,
      )
    }
  }

  // 5. nothing landed, window closes
  if (now >= next.food.safeUntil && next.status !== 'accepted') {
    next = { ...next, status: 'expired' }
    add(
      next.food.safeUntil,
      'system',
      `Safe-eating window closed — ${next.food.meals} meals unsold and lost`,
    )
  }

  return next
}

export function acceptRescue(
  r: Rescue,
  now: number,
  partnerId?: string,
): Rescue {
  if (r.status === 'accepted' || r.status === 'closed') return r
  const target =
    partnerId ?? r.broadcasts.find((b) => b.status === 'sent')?.partnerId
  if (!target) return r
  const p = partnerById(target)
  const pendingCount = r.broadcasts.filter((b) => b.status === 'sent').length
  return {
    ...r,
    status: 'accepted',
    assignee: target,
    acceptedAt: now,
    broadcasts: r.broadcasts.map((b) =>
      b.partnerId === target
        ? { ...b, status: 'accepted' }
        : b.status === 'sent'
          ? { ...b, status: 'withdrawn' }
          : b,
    ),
    events: [
      ...r.events,
      event(
        now,
        'human',
        `${p?.name ?? 'Partner'} accepted the pickup — ${beforeCutoff(
          Math.max(0, r.food.safeUntil - now),
        )}`,
      ),
      ...(pendingCount > 1
        ? [event(now, 'system', `Other open invitations withdrawn`)]
        : []),
    ],
  }
}

export function declineRescue(r: Rescue, now: number, partnerId?: string): Rescue {
  if (r.status === 'accepted' || r.status === 'closed') return r
  const target =
    partnerId ?? r.broadcasts.find((b) => b.status === 'sent')?.partnerId
  if (!target) return r
  const p = partnerById(target)
  const stillOpen = r.broadcasts.filter(
    (b) => b.status === 'sent' && b.partnerId !== target,
  ).length
  return {
    ...r,
    status: stillOpen > 0 ? r.status : 'escalated',
    broadcasts: r.broadcasts.map((b) =>
      b.partnerId === target
        ? { ...b, status: 'declined', note: 'declined from the rescue link' }
        : b,
    ),
    events: [
      ...r.events,
      event(now, 'human', `${p?.name ?? 'Partner'} declined from the rescue link`),
    ],
  }
}

export function closeRescue(r: Rescue, now: number, h: Handover): Rescue {
  return {
    ...r,
    status: 'closed',
    handover: h,
    events: [
      ...r.events,
      event(
        now,
        'human',
        `Handover signed — ${h.meals} meals, ${h.kg.toFixed(1)} kg received by ${h.receivedBy}`,
      ),
    ],
  }
}

export function metrics(rescues: Rescue[]) {
  const closed = rescues.filter((r) => r.status === 'closed')
  const expired = rescues.filter((r) => r.status === 'expired')
  const acceptedAll = rescues.filter((r) => r.acceptedAt)
  const mealsRescued = closed.reduce((n, r) => n + (r.handover?.meals ?? 0), 0)
  const kgRescued = closed.reduce((n, r) => n + (r.handover?.kg ?? 0), 0)
  const lostMeals = expired.reduce((n, r) => n + r.food.meals, 0)
  const flagged = rescues.filter((r) =>
    r.broadcasts.some((b) => b.status === 'declined' || b.status === 'timed_out'),
  )
  const rescuedAfterFlag = closed.filter((r) =>
    r.broadcasts.some((b) => b.status === 'declined' || b.status === 'timed_out'),
  )
  const avgAcceptMin = acceptedAll.length
    ? acceptedAll.reduce((n, r) => n + (r.acceptedAt! - r.createdAt) / MIN, 0) /
      acceptedAll.length
    : 0
  const settled = closed.length + expired.length

  return {
    mealsRescued,
    kgRescued,
    lostMeals,
    settled,
    closedCount: closed.length,
    expiredCount: expired.length,
    rescueRate: settled ? closed.length / settled : 0,
    avgAcceptMin,
    flaggedCount: flagged.length,
    savedAfterFlag: rescuedAfterFlag.length,
  }
}
