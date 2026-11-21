import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { navigate } from '../lib/router'

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
  children: ReactNode
}

export function Link({ to, children, onClick, ...rest }: Props) {
  return (
    <a
      {...rest}
      href={to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return
        e.preventDefault()
        onClick?.(e)
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}
