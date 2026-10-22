/** Diagnostics stay in the development console, never in the child-facing UI. */
export function reportDevelopmentError(area: string, error: unknown) {
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test')
    console.warn(`Math Practice: ${area}`, error)
}
