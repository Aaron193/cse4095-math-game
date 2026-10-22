import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

/** Session and summary manage question/reveal focus themselves. */
export default function RouteFocus() {
  const { pathname } = useLocation()
  const previous = useRef(pathname)
  useEffect(() => {
    if (
      previous.current !== pathname &&
      pathname !== '/practice/session' &&
      pathname !== '/practice/summary'
    ) {
      const heading = document.querySelector<HTMLElement>('main h1')
      if (heading) {
        heading.tabIndex = -1
        heading.focus({ preventScroll: true })
      }
    }
    previous.current = pathname
  }, [pathname])
  return null
}
