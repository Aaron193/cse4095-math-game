import { useId } from 'react'
import type { ReactNode } from 'react'
export default function ErrorNotice({
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
  children,
}: {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  children?: ReactNode
}) {
  const id = useId()
  return (
    <div
      className="error-notice"
      role="alert"
      aria-labelledby={title ? id : undefined}
    >
      {title && (
        <p id={id}>
          <strong>{title}</strong>
        </p>
      )}
      <p>{message}</p>
      <div className="setup-actions">
        {onRetry && (
          <button type="button" className="button" onClick={onRetry}>
            {retryLabel}
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
