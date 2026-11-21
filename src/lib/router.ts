import { useEffect, useState } from 'react'

const listeners = new Set<() => void>()

export function navigate(to: string): void {
  if (window.location.pathname === to) return
  window.history.pushState({}, '', to)
  listeners.forEach((fn) => fn())
  window.scrollTo({ top: 0 })
}

export function usePath(): string {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    listeners.add(update)
    window.addEventListener('popstate', update)
    return () => {
      listeners.delete(update)
      window.removeEventListener('popstate', update)
    }
  }, [])

  return path
}

export interface Route {
  name: 'console' | 'new' | 'impact' | 'rescue' | 'accept' | 'notfound'
  id?: string
}

export function matchRoute(path: string): Route {
  if (path === '/' || path === '') return { name: 'console' }
  if (path === '/new') return { name: 'new' }
  if (path === '/impact') return { name: 'impact' }
  const rescue = path.match(/^\/rescue\/([^/]+)$/)
  if (rescue) return { name: 'rescue', id: rescue[1] }
  const accept = path.match(/^\/accept\/([^/]+)$/)
  if (accept) return { name: 'accept', id: accept[1] }
  return { name: 'notfound' }
}
