import { vi } from 'vitest'

vi.mock('localforage', () => {
  const memory = new Map<string, unknown>()

  const instance = {
    getItem: vi.fn(async <T>(key: string): Promise<T | null> => {
      return memory.has(key) ? (memory.get(key) as T) : null
    }),
    setItem: vi.fn(async (key: string, value: unknown) => {
      memory.set(key, value)
      return value
    }),
    removeItem: vi.fn(async (key: string) => {
      memory.delete(key)
    }),
  }

  return {
    default: {
      createInstance: vi.fn(() => instance),
      dropInstance: vi.fn(async () => {}),
    },
  }
})

export {}
