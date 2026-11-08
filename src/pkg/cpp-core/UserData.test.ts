import { atom, getDefaultStore } from 'jotai'
import { describe, expect, it, vi } from 'vitest'
import type { ExpItem, Formula, IGame, IGameAdapter, Task } from '../cpp-basic'
import '../testing/mockLocalforage'
import { generateIndirects, newUserData, UserDataAtomHolder, type UserData } from './UserData'
import { TaskStatus } from './Task'

interface MiniGame extends IGame {
  characterStatus: { elite: number; level: number }
  characterTaskType: { _: 'test' }
  preferences: Record<string, never>
}

function makeGa() {
  const adapter: any = {
    getFrozenEmptyCharacterStatus: () => ({ elite: 0, level: 0 }),
    rewriteCharacters: vi.fn((_charId: string, current: any, goal: any) => {
      if (current && current.elite === 0 && current.level === 0) current = undefined
      if (goal && goal.elite === 0 && goal.level === 0) goal = undefined
      if (current && goal && current.elite === goal.elite && current.level === goal.level) goal = undefined
      return [current, goal]
    }),
    getAllCharacterIds: () => ['char_1'],
    finishedCharacterStatus: () => ({ elite: 2, level: 90 }),
    generateTasksForCharacter: () => [],
    isManuallyTask: () => false,
  }
  const ga = {
    getUserDataAdapter: () => adapter,
    getExpItems: () => ({ '##EXP': { value: { e: 2 }, indirectStage: [] } }),
    getFormulas: () => [],
    getItem: () => ({ valueAsAp: 1 }),
  } as unknown as IGameAdapter<MiniGame>
  return { ga, adapter }
}

function makeIndirectGa(options: { formulas?: Formula[]; expItems?: Record<string, ExpItem> } = {}) {
  return {
    getFormulas: () => options.formulas ?? [],
    getExpItems: () => options.expItems ?? {},
  } as unknown as IGameAdapter<MiniGame>
}

function env() {
  const { ga, adapter } = makeGa()
  const holder = new UserDataAtomHolder<MiniGame>(ga)
  const baseAtom = atom<UserData<MiniGame> | undefined>(undefined)
  const forbiddenFormulaTagsAtom = atom<string[]>([])
  holder.setAtom(baseAtom, forbiddenFormulaTagsAtom)
  const store = getDefaultStore()
  return { ga, adapter, holder, baseAtom, store, atoms: holder.atoms }
}

describe('newUserData', () => {
  it('returns an empty user data shape', () => {
    expect(newUserData()).toEqual({
      current: {},
      goal: {},
      items: {},
      goalOrder: [],
      starredTasks: [],
    })
  })
})

describe('generateIndirects', () => {
  it('returns no indirects when quantities are sufficient', () => {
    const ga = makeIndirectGa()
    const result = generateIndirects(ga, { a: 2 }, { a: 5 }, [])
    expect(result).toEqual({
      indirects: {},
      unsatisfiedRequirements: {},
      synthisisedRequirements: {},
      unsatisfiedRequirementsDueToFormulaUses: null,
    })
  })

  it('synthesizes missing amounts through formulas and reports material costs', () => {
    const ga = makeIndirectGa({
      formulas: [
        { id: 'f', itemId: 'b', quantity: 1, costs: [{ itemId: 'a', quantity: 2 }], tags: [] },
      ],
    })
    const result = generateIndirects(ga, { b: 3 }, { a: 4 }, [])

    expect(result.indirects).toEqual({ a: 6 })
    expect(result.unsatisfiedRequirements).toEqual({ a: 2 })
    expect(result.synthisisedRequirements).toEqual({ b: 3 })
  })

  it('recurses through formula chains', () => {
    const ga = makeIndirectGa({
      formulas: [
        { id: 'fb', itemId: 'b', quantity: 1, costs: [{ itemId: 'a', quantity: 1 }], tags: [] },
        { id: 'fa', itemId: 'a', quantity: 1, costs: [{ itemId: 'c', quantity: 1 }], tags: [] },
      ],
    })
    const result = generateIndirects(ga, { b: 1 }, { c: 2 }, [])

    expect(result.indirects).toEqual({ a: 1, c: 1 })
    expect(result.unsatisfiedRequirements).toEqual({})
    expect(result.synthisisedRequirements).toEqual({ a: 1, b: 1 })
  })

  it('limits synthesis when formulaUses is exhausted', () => {
    const ga = makeIndirectGa({
      formulas: [{ id: 'f', itemId: 'b', quantity: 1, costs: [{ itemId: 'a', quantity: 1 }], tags: [] }],
    })
    const result = generateIndirects(ga, { b: 3 }, {}, [], { f: 1 })

    expect(result.unsatisfiedRequirements).toEqual({ b: 2, a: 1 })
    expect(result.unsatisfiedRequirementsDueToFormulaUses).toEqual({ b: 2 })
    expect(result.synthisisedRequirements).toEqual({ b: 1 })
    expect(result.indirects).toEqual({ a: 1 })
  })

  it('consumes exp items and records indirect usage', () => {
    const ga = makeIndirectGa({
      expItems: { '##EXP': { value: { e1: 100 }, indirectStage: [{ itemId: 'e1', quantity: 1 }] } },
    })
    const result = generateIndirects(ga, { '##EXP': 250 }, { e1: 5 }, [])

    expect(result.indirects).toEqual({ e1: 3 })
    expect(result.unsatisfiedRequirements).toEqual({})
    expect(result.synthisisedRequirements).toEqual({ '##EXP': 300 })
  })

  it('falls back to indirect stages when exp items run out', () => {
    const ga = makeIndirectGa({
      expItems: { '##EXP': { value: { e1: 100 }, indirectStage: [{ itemId: 'e1', quantity: 1 }] } },
    })
    const result = generateIndirects(ga, { '##EXP': 350 }, { e1: 2 }, [])

    expect(result.indirects).toEqual({ e1: 4 })
    expect(result.unsatisfiedRequirements).toEqual({})
    // 库存吸收 200 经验后记账；剩余部分走 indirectStage，只计入 indirects
    expect(result.synthisisedRequirements).toEqual({ '##EXP': 200 })
  })

  it('respects forbidden formula tags', () => {
    const ga = makeIndirectGa({
      formulas: [{ id: 'f', itemId: 'b', quantity: 1, costs: [{ itemId: 'a', quantity: 1 }], tags: ['x'] }],
    })
    const result = generateIndirects(ga, { b: 1 }, { a: 1 }, ['x'])

    expect(result.unsatisfiedRequirements).toEqual({ b: 1 })
    expect(result.indirects).toEqual({})
  })

  it('reports unsatisfied requirements when no formula exists', () => {
    const ga = makeGa().ga
    const result = generateIndirects(ga, { b: 1 }, {}, [])
    expect(result.unsatisfiedRequirements).toEqual({ b: 1 })
    expect(result.synthisisedRequirements).toEqual({})
  })
})

describe('UserDataAtomHolder', () => {
  it('defaults missing user data through rootAtom', () => {
    const { store, atoms } = env()
    expect(store.get(atoms.rootAtom)).toEqual(newUserData())
  })

  it('supports transactional edits through allDataAtom with undo/redo', () => {
    const { store, baseAtom, atoms } = env()
    store.set(atoms.allDataAtom, (data) => {
      data.items.x = 3
    })
    expect(store.get(baseAtom)!.items.x).toBe(3)

    store.set(atoms.dataAtom, 'undo')
    expect(store.get(baseAtom)!.items).toEqual({})

    store.set(atoms.dataAtom, 'redo')
    expect(store.get(baseAtom)!.items.x).toBe(3)
  })

  it('writes current character status and drops an equal goal', () => {
    const { store, baseAtom, atoms, adapter } = env()
    store.set(atoms.currentCharacter('char_1'), (d) => {
      d.elite = 1
      d.level = 30
    })

    const data = store.get(baseAtom)!
    expect(data.current.char_1).toEqual({ elite: 1, level: 30 })
    expect(data.goal.char_1).toBeUndefined()
    expect(store.get(atoms.goalOrder)).toEqual([])
    expect(adapter.rewriteCharacters).toHaveBeenCalled()
  })

  it('writes goal character status and registers it in goalOrder', () => {
    const { store, baseAtom, atoms } = env()
    store.set(atoms.goalCharacter('char_2'), (d) => {
      d.elite = 2
      d.level = 80
    })

    const data = store.get(baseAtom)!
    expect(data.goal.char_2).toEqual({ elite: 2, level: 80 })
    expect(data.current.char_2).toBeUndefined()
    expect(store.get(atoms.goalOrder)).toEqual(['char_2'])
  })

  it('computes exp item quantities from underlying items', () => {
    const { store, atoms } = env()
    store.set(atoms.itemQuantity('e'), 5)
    expect(store.get(atoms.itemQuantity('e'))).toBe(5)
    expect(store.get(atoms.itemQuantity('##EXP'))).toBe(10)
  })

  it('keeps freshly starred ids and cleans stale ones on the next edit', () => {
    const { store, baseAtom, atoms } = env()
    store.set(atoms.stars, (d) => {
      d.push('t1')
    })
    expect(store.get(baseAtom)!.starredTasks).toEqual(['t1'])

    store.set(atoms.currentCharacter('char_1'), (d) => {
      d.elite = 1
    })
    expect(store.get(baseAtom)!.starredTasks).toEqual([])
  })

  it('orders starred tasks with their indirect dependencies first', () => {
    const { store, atoms, adapter } = env()
    const t1: Task<MiniGame> = { id: 't1', charId: 'char_1', type: { _: 'test' }, requires: [], depends: [] }
    const t2: Task<MiniGame> = { id: 't2', charId: 'char_1', type: { _: 'test' }, requires: [], depends: [t1] }
    adapter.generateTasksForCharacter = () => [t1, t2]
    store.set(atoms.baseAtom, {
      ...newUserData(),
      goalOrder: ['char_1'],
      goal: { char_1: { elite: 2, level: 90 } },
      current: { char_1: { elite: 1, level: 30 } },
      starredTasks: ['t2'],
    })

    const details = store.get(atoms.allStarredTasksDetails)
    expect(details.untouched).toEqual(new Set())
    expect(details.directStars.has(t2)).toBe(true)
    expect(details.indirectStars.has(t1)).toBe(true)
    expect(details.sortedStarredTasks).toEqual([t1, t2])
    expect(details.sortedGoalTasks).toEqual([t1, t2])
    expect(store.get(atoms.allStarredTasks).map((x) => x.id)).toEqual(['t1', 't2'])
  })

  it('aggregates requirements and computes task extras for starred, goal and finished tasks', () => {
    const { store, atoms, adapter } = env()
    adapter.generateTasksForCharacter = () => [
      { id: 't1', charId: 'char_1', type: { _: 'test' }, requires: [{ itemId: 'a', quantity: 1 }], depends: [] },
    ]
    store.set(atoms.baseAtom, {
      ...newUserData(),
      goalOrder: ['char_1'],
      goal: { char_1: { elite: 2, level: 90 } },
      current: { char_1: { elite: 1, level: 30 } },
      starredTasks: ['t1'],
    })

    expect(store.get(atoms.allStarredTaskRequirements)).toEqual({ a: 1 })
    expect(store.get(atoms.allGoalTaskRequirements)).toEqual({ a: 1 })
    expect(store.get(atoms.starredTasksWithExtra)[0][1].status).toBe(TaskStatus.AllUnmet)
    expect(store.get(atoms.goalTasksWithExtra)[0][1].status).toBe(TaskStatus.AllUnmet)
    expect(store.get(atoms.finishedTasksWithExtra)).toHaveLength(1)
    expect(store.get(atoms.allFinishedIndirects)).toEqual({})
  })

  it('keeps unstarred tasks after starred tasks in goal order', () => {
    const { store, atoms, adapter } = env()
    const t1: Task<MiniGame> = { id: 't1', charId: 'char_1', type: { _: 'test' }, requires: [], depends: [] }
    const t2: Task<MiniGame> = { id: 't2', charId: 'char_1', type: { _: 'test' }, requires: [], depends: [t1] }
    const t3: Task<MiniGame> = { id: 't3', charId: 'char_1', type: { _: 'test' }, requires: [], depends: [] }
    adapter.generateTasksForCharacter = () => [t1, t2, t3]
    store.set(atoms.baseAtom, {
      ...newUserData(),
      goalOrder: ['char_1'],
      goal: { char_1: { elite: 2, level: 90 } },
      current: { char_1: { elite: 1, level: 30 } },
      starredTasks: ['t2'],
    })

    expect(store.get(atoms.allStarredTasksDetails).sortedGoalTasks).toEqual([t1, t2, t3])
  })

  it('detects finished characters by comparing current and finished status', () => {
    const { store, atoms, adapter } = env()
    adapter.finishedCharacterStatus = () => ({ elite: 2, level: 90 })
    expect(store.get(atoms.isCharacterFinished('char_1'))).toBe(false)

    store.set(atoms.baseAtom, { ...newUserData(), current: { char_1: { elite: 2, level: 90 } } })
    expect(store.get(atoms.isCharacterFinished('char_1'))).toBe(true)
  })
})
