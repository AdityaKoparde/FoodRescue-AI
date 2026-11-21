import type { Donor, Partner } from './types'

export const PARTNERS: Partner[] = [
  {
    id: 'p-annapurna',
    name: 'Annapurna Trust Kitchen',
    kind: 'ngo',
    area: 'Saraswathipuram',
    lat: 12.303,
    lng: 76.648,
    capacity: 120,
    reliability: 0.82,
    respondMin: 6,
    verified: true,
  },
  {
    id: 'p-foodbank',
    name: 'Mysuru Food Bank',
    kind: 'ngo',
    area: 'Yadavagiri',
    lat: 12.321,
    lng: 76.618,
    capacity: 300,
    reliability: 0.91,
    respondMin: 4,
    verified: true,
  },
  {
    id: 'p-rotaract',
    name: 'Rotaract Volunteer Network',
    kind: 'volunteer',
    area: 'Kuvempunagar',
    lat: 12.296,
    lng: 76.66,
    capacity: 200,
    reliability: 0.68,
    respondMin: 11,
    verified: false,
  },
  {
    id: 'p-nammamane',
    name: 'Namma Mane Old Age Home',
    kind: 'shelter',
    area: 'Vontikoppal',
    lat: 12.312,
    lng: 76.651,
    capacity: 40,
    reliability: 0.74,
    respondMin: 7,
    verified: true,
  },
  {
    id: 'p-krishna',
    name: 'Sri Krishna Seva Ashram',
    kind: 'shelter',
    area: 'K.R. Mohalla',
    lat: 12.288,
    lng: 76.621,
    capacity: 60,
    reliability: 0.61,
    respondMin: 9,
    verified: false,
  },
  {
    id: 'p-asha',
    name: 'Asha Kirana Orphanage',
    kind: 'shelter',
    area: 'Bannimantap',
    lat: 12.274,
    lng: 76.63,
    capacity: 80,
    reliability: 0.55,
    respondMin: 14,
    verified: false,
  },
]

export const DONORS: Donor[] = [
  {
    name: 'Vidyaranya College Canteen',
    kind: 'College canteen',
    area: 'Jayalakshmipuram',
    lat: 12.314,
    lng: 76.625,
  },
  {
    name: 'Hotel Dasaprakash',
    kind: 'Restaurant',
    area: 'Gandhi Square',
    lat: 12.301,
    lng: 76.652,
  },
  {
    name: 'Sri Vasavi Marriage Hall',
    kind: 'Marriage hall',
    area: 'Vijayanagar',
    lat: 12.283,
    lng: 76.612,
  },
  {
    name: 'Cafe Bahula',
    kind: 'Bakery',
    area: 'Gokulam',
    lat: 12.33,
    lng: 76.618,
  },
]

export function partnerById(id: string | undefined): Partner | undefined {
  if (!id) return undefined
  return PARTNERS.find((p) => p.id === id)
}
