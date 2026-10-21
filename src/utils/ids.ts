/** Secure UUIDs avoid counters that restart and collide after a page refresh. */
export function createQuestionId(): string {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error(
      'Secure question ID generation is unavailable; use HTTPS or localhost',
    )
  }
  return globalThis.crypto.randomUUID()
}
