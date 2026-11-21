import { closeRescue, makeRescue, tickRescue } from './engine'
import { partnerById } from './partners'
import type { Food, Rescue } from './types'

const MIN = 60_000
const HOUR = 60 * MIN

export const SAFETY_RULE: Record<Food['kind'], number> = {
  veg: 120,
  nonveg: 90,
  bakery: 480,
  mixed: 120,
}

export function safeUntilFor(preparedAt: number, kind: Food['kind']): number {
  return preparedAt + SAFETY_RULE[kind] * MIN
}

export interface Snapshot {
  version: 1
  simNow: number
  speed: number
  rescues: Rescue[]
  savedAt: number
}

function donor(index: number) {
  return [
    {
      name: 'Hotel Dasaprakash',
      kind: 'Restaurant',
      area: 'Gandhi Square',
      lat: 12.301,
      lng: 76.652,
    },
    {
      name: 'Vidyaranya College Canteen',
      kind: 'College canteen',
      area: 'Jayalakshmipuram',
      lat: 12.314,
      lng: 76.625,
    },
    {
      name: 'Cafe Bahula',
      kind: 'Bakery',
      area: 'Gokulam',
      lat: 12.33,
      lng: 76.618,
    },
    {
      name: 'Sri Vasavi Marriage Hall',
      kind: 'Marriage hall',
      area: 'Vijayanagar',
      lat: 12.283,
      lng: 76.612,
    },
  ][index]
}

function buildRescues(now: number): Rescue[] {
  const rescues: Rescue[] = []

  // 1. live, already escalated once — the room walks in on a rescue in progress
  const r1 = makeRescue({
    donor: donor(0),
    now: now - 15 * MIN,
    source: 'vision',
    code: 'FR-1041',
    food: {
      title: 'Veg thali — rice, sambar, palya',
      kind: 'veg',
      meals: 46,
      kg: 21.5,
      allergens: ['dairy'],
      preparedAt: now - 45 * MIN,
      safeUntil: now - 45 * MIN + SAFETY_RULE.veg * MIN,
    },
  })
  rescues.push(tickRescue(r1, now))

  // 2. fresh listing, three invitations out
  const r2 = makeRescue({
    donor: donor(1),
    now: now - 2 * MIN,
    source: 'manual',
    code: 'FR-1042',
    food: {
      title: 'Curd rice and vegetable pulao',
      kind: 'veg',
      meals: 62,
      kg: 26,
      allergens: ['dairy', 'nuts'],
      preparedAt: now - 50 * MIN,
      safeUntil: now - 50 * MIN + SAFETY_RULE.veg * MIN,
    },
  })
  rescues.push(tickRescue(r2, now))

  // 3. closed yesterday, but only after two partners failed — proof the escalation mattered
  let r3 = makeRescue({
    donor: donor(2),
    now: now - 26 * HOUR,
    source: 'vision',
    code: 'FR-1038',
    food: {
      title: 'Bakery trays — buns, veg puffs',
      kind: 'bakery',
      meals: 28,
      kg: 9.4,
      allergens: ['gluten', 'dairy'],
      preparedAt: now - 27 * HOUR,
      safeUntil: now - 27 * HOUR + SAFETY_RULE.bakery * MIN,
    },
  })
  r3 = tickRescue(r3, now - 26 * HOUR + 32 * MIN)
  r3 = closeRescue(r3, now - 26 * HOUR + 36 * MIN, {
    at: now - 26 * HOUR + 36 * MIN,
    receivedBy: partnerById(r3.assignee)?.name ?? 'Annapurna Trust Kitchen',
    meals: 28,
    kg: 9.4,
    note: 'Two volunteers collected in a hatchback. Crates returned the next morning.',
  })
  rescues.push(r3)

  // 4. a loss, kept visible — the hall called twenty minutes before its own cutoff
  let r4 = makeRescue({
    donor: donor(3),
    now: now - 100 * MIN,
    source: 'manual',
    code: 'FR-1036',
    food: {
      title: 'Wedding buffet — mixed',
      kind: 'mixed',
      meals: 120,
      kg: 54,
      allergens: ['dairy', 'gluten'],
      preparedAt: now - 200 * MIN,
      safeUntil: now - 80 * MIN,
    },
  })
  r4 = tickRescue(r4, now)
  rescues.push(r4)

  return rescues
}

export function seedState(now: number): Snapshot {
  return {
    version: 1,
    simNow: now,
    speed: 1,
    rescues: buildRescues(now),
    savedAt: Date.now(),
  }
}
