import { afterEach, describe, expect, it, vi } from 'vitest'
import { createQuestionId } from './ids'

afterEach(() => vi.unstubAllGlobals())

describe('createQuestionId', () => {
  it('creates well-formed unique UUIDs across repeated calls', () => {
    const ids = Array.from({ length: 1000 }, () => createQuestionId())
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids)
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
  })
  it('explains unavailable secure ID generation rather than silently reusing an ID', () => {
    vi.stubGlobal('crypto', undefined)
    expect(() => createQuestionId()).toThrow('HTTPS or localhost')
  })
})
