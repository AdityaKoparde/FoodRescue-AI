import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  acceptRescue,
  closeRescue,
  declineRescue,
  makeRescue,
  tickRescue,
} from './engine'
import { seedState } from './seed'
import type { Snapshot } from './seed'
import type { Donor, Food, Handover } from './types'

const KEY = 'foodrescue.desk'
const MAX_AGE = 6 * 60 * 60 * 1000

function load(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Snapshot
      if (
        parsed.version === 1 &&
        Array.isArray(parsed.rescues) &&
        Date.now() - parsed.savedAt < MAX_AGE
      ) {
        return { ...parsed, speed: parsed.speed || 1 }
      }
    }
  } catch {
    /* a corrupt demo state is not worth saving */
  }
  return seedState(Date.now())
}

interface StoreValue {
  simNow: number
  speed: number
  rescues: Snapshot['rescues']
  setSpeed: (speed: number) => void
  createRescue: (donor: Donor, food: Food, source: 'manual' | 'vision') => string
  accept: (id: string, partnerId?: string) => void
  decline: (id: string, partnerId?: string) => void
  handover: (id: string, received: Omit<Handover, 'at'>) => void
  reset: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<Snapshot>(load)
  const ref = useRef(snap)

  useEffect(() => {
    ref.current = snap
  }, [snap])

  useEffect(() => {
    const id = window.setInterval(() => {
      setSnap((prev) => {
        const nextNow = prev.simNow + 250 * prev.speed
        let dirty = false
        const rescues = prev.rescues.map((r) => {
          const next = tickRescue(r, nextNow)
          if (next !== r) dirty = true
          return next
        })
        return {
          ...prev,
          simNow: nextNow,
          rescues: dirty ? rescues : prev.rescues,
        }
      })
    }, 250)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = ref.current
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...s, savedAt: Date.now() }))
      } catch {
        /* storage full or blocked — the demo still runs in memory */
      }
    }, 1500)
    return () => window.clearInterval(id)
  }, [])

  const setSpeed = useCallback((speed: number) => {
    setSnap((prev) => ({ ...prev, speed }))
  }, [])

  const createRescue = useCallback(
    (donor: Donor, food: Food, source: 'manual' | 'vision') => {
      const used = new Set(ref.current.rescues.map((r) => r.code))
      let code = ''
      do {
        code = `FR-${1000 + Math.floor(Math.random() * 9000)}`
      } while (used.has(code))
      setSnap((prev) => ({
        ...prev,
        rescues: [
          makeRescue({ donor, food, now: prev.simNow, source, code }),
          ...prev.rescues,
        ],
      }))
      return code.toLowerCase()
    },
    [],
  )

  const accept = useCallback((id: string, partnerId?: string) => {
    setSnap((prev) => ({
      ...prev,
      rescues: prev.rescues.map((r) =>
        r.id === id ? acceptRescue(r, prev.simNow, partnerId) : r,
      ),
    }))
  }, [])

  const decline = useCallback((id: string, partnerId?: string) => {
    setSnap((prev) => ({
      ...prev,
      rescues: prev.rescues.map((r) =>
        r.id === id ? declineRescue(r, prev.simNow, partnerId) : r,
      ),
    }))
  }, [])

  const handover = useCallback(
    (id: string, received: Omit<Handover, 'at'>) => {
      setSnap((prev) => ({
        ...prev,
        rescues: prev.rescues.map((r) =>
          r.id === id
            ? closeRescue(r, prev.simNow, { ...received, at: prev.simNow })
            : r,
        ),
      }))
    },
    [],
  )

  const reset = useCallback(() => {
    const fresh = seedState(Date.now())
    setSnap(fresh)
    try {
      localStorage.setItem(KEY, JSON.stringify(fresh))
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      simNow: snap.simNow,
      speed: snap.speed,
      rescues: snap.rescues,
      setSpeed,
      createRescue,
      accept,
      decline,
      handover,
      reset,
    }),
    [snap, setSpeed, createRescue, accept, decline, handover, reset],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
