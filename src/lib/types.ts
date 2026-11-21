export type PartnerKind = 'ngo' | 'shelter' | 'volunteer'

export interface Partner {
  id: string
  name: string
  kind: PartnerKind
  area: string
  lat: number
  lng: number
  capacity: number
  /** 0..1 — share of accepted pickups that actually arrived */
  reliability: number
  /** typical minutes to answer a broadcast */
  respondMin: number
  verified: boolean
}

export interface Donor {
  name: string
  kind: string
  area: string
  lat: number
  lng: number
}

export type BroadcastStatus =
  | 'sent'
  | 'declined'
  | 'timed_out'
  | 'accepted'
  | 'withdrawn'

export interface Broadcast {
  partnerId: string
  at: number
  channel: 'link'
  status: BroadcastStatus
  note?: string
}

export type RescueStatus =
  | 'broadcast'
  | 'escalated'
  | 'accepted'
  | 'closed'
  | 'expired'

export type EventKind = 'system' | 'partner' | 'human'

export interface RescueEvent {
  at: number
  kind: EventKind
  text: string
}

export interface Handover {
  at: number
  receivedBy: string
  meals: number
  kg: number
  note: string
}

export interface Food {
  title: string
  kind: 'veg' | 'nonveg' | 'bakery' | 'mixed'
  meals: number
  kg: number
  allergens: string[]
  preparedAt: number
  /** absolute timestamp of the safe-eating cutoff */
  safeUntil: number
}

export interface Rescue {
  id: string
  code: string
  donor: Donor
  food: Food
  status: RescueStatus
  createdAt: number
  /** minutes of safe window the donor declared */
  windowMin: number
  matchRadiusKm: number
  acceptedAt?: number
  broadcasts: Broadcast[]
  events: RescueEvent[]
  assignee?: string
  handover?: Handover
  source: 'manual' | 'vision'
}
