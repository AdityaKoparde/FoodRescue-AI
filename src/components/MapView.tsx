import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Ranked } from '../lib/engine'
import { partnerById } from '../lib/partners'
import type { Rescue } from '../lib/types'

interface Props {
  rescue: Rescue
  ranked: Ranked[]
}

const COLORS: Record<string, string> = {
  accepted: '#7f9c1f',
  declined: '#bd5238',
  timed_out: '#a09880',
  sent: '#17190f',
  withdrawn: '#c9c4b4',
}

export function MapView({ rescue, ranked }: Props) {
  const holder = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layers = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!holder.current || map.current) return
    const m = L.map(holder.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([rescue.donor.lat, rescue.donor.lng], 14)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(m)
    layers.current = L.layerGroup().addTo(m)
    map.current = m
    return () => {
      m.remove()
      map.current = null
      layers.current = null
    }
    // the map is rebuilt only when the selected rescue changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const m = map.current
    const group = layers.current
    if (!m || !group) return
    group.clearLayers()

    L.circle([rescue.donor.lat, rescue.donor.lng], {
      radius: rescue.matchRadiusKm * 1000,
      color: '#9d967f',
      weight: 1,
      dashArray: '3 5',
      fill: false,
    }).addTo(group)

    const donor = L.marker([rescue.donor.lat, rescue.donor.lng], {
      icon: L.divIcon({
        className: '',
        html: '<div class="pin pin-donor" title="Donor">D</div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      keyboard: false,
    })
    donor.bindTooltip(rescue.donor.name, { direction: 'top', offset: [0, -12] })
    donor.addTo(group)

    for (const b of rescue.broadcasts) {
      const p = partnerById(b.partnerId)
      if (!p) continue
      const accepted = rescue.assignee === b.partnerId
      const marker = L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div class="pin ${accepted ? 'pin-accepted' : ''}" style="border-color:${
            COLORS[b.status] ?? '#17190f'
          };color:${COLORS[b.status] ?? '#17190f'}">${accepted ? '✓' : '•'}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
        keyboard: false,
      })
      marker.bindTooltip(`${p.name} · ${b.status.replace('_', ' ')}`, {
        direction: 'top',
        offset: [0, -10],
      })
      marker.addTo(group)
    }

    // a quiet label for the highest-ranked partner that has not been invited yet
    const uninvited = ranked.find(
      (r) => !rescue.broadcasts.some((b) => b.partnerId === r.partner.id),
    )
    if (uninvited) {
      L.circleMarker([uninvited.partner.lat, uninvited.partner.lng], {
        radius: 4,
        color: '#8c8672',
        weight: 1,
        fillColor: '#f4f1e8',
        fillOpacity: 1,
      })
        .bindTooltip(`${uninvited.partner.name} · standby`, { direction: 'top' })
        .addTo(group)
    }

    const pts: [number, number][] = [
      [rescue.donor.lat, rescue.donor.lng],
      ...rescue.broadcasts
        .map((b) => partnerById(b.partnerId))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p) => [p.lat, p.lng] as [number, number]),
    ]
    m.fitBounds(L.latLngBounds(pts).pad(0.55), { animate: false, maxZoom: 13 })
  }, [rescue, ranked])

  return (
    <div
      ref={holder}
      className="h-full w-full"
      role="img"
      aria-label={`Map of ${rescue.donor.name} and invited partners in Mysuru`}
    />
  )
}
