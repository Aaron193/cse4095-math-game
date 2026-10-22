import { useCallback, useEffect, useRef } from 'react'
import { useBeforeUnload, useBlocker, useLocation } from 'react-router'
import { useSession } from '../app/practiceSessionContext'

export default function SessionNavigationSafety() {
  const { state, endSession } = useSession()
  const { pathname } = useLocation()
  const endAfterNavigation = useRef(false)
  useEffect(() => {
    if (endAfterNavigation.current && pathname !== '/practice/session') {
      endAfterNavigation.current = false
      endSession()
    }
  }, [pathname, endSession])
  const active = state?.isActive ?? false
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      active &&
      currentLocation.pathname === '/practice/session' &&
      nextLocation.pathname !== '/practice/session',
  )
  useBeforeUnload(
    useCallback(
      (event) => {
        if (active) {
          event.preventDefault()
          event.returnValue = ''
        }
      },
      [active],
    ),
  )
  const dialog = useRef<HTMLDialogElement>(null)
  const stay = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const element = dialog.current
    if (blocker.state === 'blocked') {
      element?.showModal()
      stay.current?.focus()
    }
    return () => element?.close()
  }, [blocker.state])
  if (blocker.state !== 'blocked') return null
  return (
    <dialog
      ref={dialog}
      aria-labelledby="leave-title"
      aria-describedby="leave-description"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls =
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            'button:not(:disabled)',
          )
        const first = controls[0],
          last = controls[controls.length - 1]
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        blocker.reset()
      }}
    >
      <h2 id="leave-title">Leave your practice?</h2>
      <p id="leave-description">
        Your answers and current card are saved when browser storage is
        available. You can keep practicing, save and leave for now, or finish
        this session.
      </p>
      <div className="setup-actions">
        <button
          ref={stay}
          type="button"
          className="button"
          onClick={() => blocker.reset()}
        >
          Keep Practicing
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => blocker.proceed()}
        >
          Save and Leave
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            endAfterNavigation.current = true
            blocker.proceed()
          }}
        >
          End Session and Leave
        </button>
      </div>
    </dialog>
  )
}
