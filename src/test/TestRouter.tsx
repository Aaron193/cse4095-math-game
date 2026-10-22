import { useState } from 'react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
export default function TestRouter({
  children,
  initialEntries = ['/'],
}: {
  children: ReactNode
  initialEntries?: string[]
}) {
  const [router] = useState(() =>
    createMemoryRouter([{ path: '*', element: children }], { initialEntries }),
  )
  return <RouterProvider router={router} />
}
