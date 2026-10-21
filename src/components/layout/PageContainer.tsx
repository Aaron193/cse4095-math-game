import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
}

export default function PageContainer({ children }: PageContainerProps) {
  return (
    <main id="main-content" tabIndex={-1}>
      {children}
    </main>
  )
}
