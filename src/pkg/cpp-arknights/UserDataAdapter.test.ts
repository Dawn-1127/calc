import { describe, expect, it } from 'vitest'
import '../testing/mockLocalforage'
import type { ArknightsCharacterStatus } from './types'
import { ArknightsUserDataAdapter } from './UserDataAdapter'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

const EXP = [Array(50).fill(100), Array(80).fill(120), Array(90).fill(200)]
const GOLD = [Array(50).fill(30), Array(80).fill(48), Array(90).fill(80)]
const EVOLVE_GOLD = [
  [-1, -1],
  [-1, -1],
  [10000, -1],
  [15000, 60000],
  [20000, 120000],
  [30000, 180000],
]

function charStub(key = 'char_1') {
  return {
    key,
    raw: {
      displayNumber: '01',
      rarity: 'TIER_5',
      profession: 'CASTER',
      phases: [
        null,
        { evolveCost: [{ id: 'chip1', count: 4 }, { id: 'chip2', count: 2 }] },
        { evolveCost: [{ id: 'chip3', count: 1 }] },
      ],
      allSkillLvlup: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
        lvlUpCost: [{ id: 't' + n, count: n }],
        unlockCond: null,
      })),
      skills: [
        {
          skillId: 'sk1',
          charSkillIndex: 0,
          levelUpCostCond: [
            { levelUpCost: [{ id: 'm1', count: 1 }] },
            { levelUpCost: [{ id: 'm2', count: 2 }] },
            { levelUpCost: [{ id: 'm3', count: 4 }] },
          ],
        },
      ],
    },
    maxElite: 2,
    maxLevels: [50, 80, 90],
    rarity: 5,
    modUnlockLevel: 40,
    allSkillLvlup: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
      lvlUpCost: [{ id: 't' + n, count: n }],
      unlockCond: null,
    })),
    skills: [
      {
        skillId: 'sk1',
        rawCharId: key,
        charSkillIndex: 0,
        charSkill: {
          skillId: 'sk1',
          charSkillIndex: 0,
          levelUpCostCond: [
            { levelUpCost: [{ id: 'm1', count: 1 }] },
            { levelUpCost: [{ id: 'm2', count: 2 }] },
            { levelUpCost: [{ id: 'm3', count: 4 }] },
          ],
        },
        skill: { name: 'Ignition' },
      },
    ],
    uniEquips: [
      {
        equipId: 'uniequip_1',
        rawCharId: key,
        equip: {
          raw: {
            unlockEvolvePhase: 'PHASE_2',
            typeName2: 'X',
            charEquipOrder: 1,
            itemCost: {
              1: [{ id: 'u1', count: 1 }],
              2: [{ id: 'u2', count: 2 }],
              3: [{ id: 'u3', count: 3 }],
            },
          },
          name: 'Module X',
        },
      },
    ],
  }
}

function makeDm() {
  const char2 = charStub('char_2')
  ;(char2.raw as any).displayNumber = undefined
  return {
    data: {
      characters: { char_1: charStub(), char_2: char2 },
      constants: {
        maxLevel: [[30], [30], [40, 55], [45, 60, 70], [50, 70, 80], [50, 80, 90]],
        characterExpMap: EXP,
        characterUpgradeCostMap: GOLD,
        evolveGoldCost: EVOLVE_GOLD,
      },
      items: {},
      skills: {},
      uniEquips: {},
    },
  }
}

function makeAdapter() {
  return new ArknightsUserDataAdapter(makeDm() as any)
}

const st = (
  elite = 0,
  level = 0,
  skillLevel = 1,
  skillMaster: Record<string, number> = {},
  modLevel: Record<string, number> = {},
): ArknightsCharacterStatus => ({ elite, level, skillLevel, skillMaster, modLevel })

describe('ArknightsUserDataAdapter', () => {
  it('returns frozen empty status', () => {
    const adapter = makeAdapter()
    expect(adapter.getFrozenEmptyCharacterStatus()).toEqual({ elite: 0, level: 0, skillLevel: 1, skillMaster: {}, modLevel: {} })
  })

  it('lists only characters with a display number', () => {
    expect(makeAdapter().getAllCharacterIds()).toEqual(['char_1'])
  })

  describe('compareCharacter / isAbsentCharacter / isFavCharacter', () => {
    const a = { rarity: 5 } as any
    const b = { rarity: 4 } as any

    it('sorts by rarity, elite and level', () => {
      const adapter = makeAdapter()
      expect(adapter.compareCharacter(a, b, st(0, 1), st(0, 1))).toBe(-1)
      expect(adapter.compareCharacter(b, a, st(0, 1), st(0, 1))).toBe(1)
      expect(adapter.compareCharacter(a, a, st(2, 90), st(2, 80))).toBe(-1)
      expect(adapter.compareCharacter(a, a, st(1, 50), st(2, 90))).toBe(1)
      expect(adapter.compareCharacter(a, a, st(2, 90), st(2, 90))).toBe(0)
    })

    it('detects absent and favorite characters', () => {
      const adapter = makeAdapter()
      expect(adapter.isAbsentCharacter(a, st(0, 0))).toBe(true)
      expect(adapter.isAbsentCharacter(a, st(0, 1))).toBe(false)
      expect(adapter.isFavCharacter(a, st(1, 50))).toBe(true)
      expect(adapter.isFavCharacter(a, st(2, 1))).toBe(false)
    })
  })

  it('marks join tasks as manual', () => {
    const adapter = makeAdapter()
    expect(adapter.isManuallyTask({ id: 'x', charId: 'char_1', type: { _: 'join' }, requires: [], depends: [] })).toBe(true)
    expect(adapter.isManuallyTask({ id: 'x', charId: 'char_1', type: { _: 'level', elite: 0, from: 1, to: 2 }, requires: [], depends: [] })).toBe(false)
  })

  describe('generateTasksForCharacter', () => {
    it('returns no tasks when current equals goal', () => {
      expect(makeAdapter().generateTasksForCharacter('char_1', st(2, 90, 7), st(2, 90, 7))).toEqual([])
    })

    it('creates a join task followed by a level task for new characters', () => {
      const tasks = makeAdapter().generateTasksForCharacter('char_1', st(), st(0, 30))
      expect(tasks.map((t) => t.type)).toEqual([
        { _: 'join' },
        { _: 'level', elite: 0, from: 1, to: 30 },
      ])
      expect(tasks[1].requires).toEqual([
        { itemId: '##EXP', quantity: sum(EXP[0].slice(0, 29)) },
        { itemId: '4001', quantity: sum(GOLD[0].slice(0, 29)) },
      ])
      expect(tasks[1].depends).toEqual([tasks[0]])
    })

    it('chains elite and level tasks up to the goal', () => {
      const tasks = makeAdapter().generateTasksForCharacter('char_1', st(0, 1), st(2, 90))
      expect(tasks.map((t) => t.type)).toEqual([
        { _: 'level', elite: 0, from: 1, to: 50 },
        { _: 'elite', elite: 1 },
        { _: 'level', elite: 1, from: 1, to: 80 },
        { _: 'elite', elite: 2 },
        { _: 'level', elite: 2, from: 1, to: 90 },
      ])
      expect(tasks[1].requires).toEqual([
        { itemId: '4001', quantity: 30000 },
        { itemId: 'chip1', quantity: 4 },
        { itemId: 'chip2', quantity: 2 },
      ])
      expect(tasks[3].requires).toEqual([
        { itemId: '4001', quantity: 180000 },
        { itemId: 'chip3', quantity: 1 },
      ])
      expect(tasks[2].depends).toEqual([tasks[1]])
      expect(tasks[4].depends).toEqual([tasks[3]])
    })

    it('requires elite 1 before skill level 5', () => {
      const tasks = makeAdapter().generateTasksForCharacter('char_1', st(0, 50), st(0, 50, 7))
      const elite = tasks.find((t) => t.type._ === 'elite')!
      expect(elite.type).toEqual({ _: 'elite', elite: 1 })
      const skills = tasks.filter((t) => t.type._ === 'skill')
      expect(skills).toHaveLength(6)
      expect(skills[0].requires).toEqual([{ itemId: 't1', quantity: 1 }])
      expect(skills[5].requires).toEqual([{ itemId: 't6', quantity: 6 }])
      expect(skills[3].depends[0]).toBe(elite)
      expect(skills[3].depends[1]).toBe(skills[2])
    })

    it('requires elite 2 before skill mastery', () => {
      const tasks = makeAdapter().generateTasksForCharacter('char_1', st(0, 50, 7), st(0, 50, 7, { sk1: 2 }))
      expect(tasks.map((t) => t.type)).toEqual([
        { _: 'elite', elite: 1 },
        { _: 'level', elite: 1, from: 1, to: 80 },
        { _: 'elite', elite: 2 },
        { _: 'skillMaster', skillId: 'sk1', to: 1 },
        { _: 'skillMaster', skillId: 'sk1', to: 2 },
      ])
      expect(tasks[3].requires).toEqual([{ itemId: 'm1', quantity: 1 }])
      expect(tasks[4].requires).toEqual([{ itemId: 'm2', quantity: 2 }])
      expect(tasks[4].depends[0]).toBe(tasks[2])
      expect(tasks[4].depends[1]).toBe(tasks[3])
    })

    it('requires elite 2 and level 40 before modules', () => {
      const tasks = makeAdapter().generateTasksForCharacter('char_1', st(0, 50), st(0, 50, 1, {}, { uniequip_1: 2 }))
      expect(tasks.map((t) => t.type)).toEqual([
        { _: 'elite', elite: 1 },
        { _: 'level', elite: 1, from: 1, to: 80 },
        { _: 'elite', elite: 2 },
        { _: 'level', elite: 2, from: 1, to: 40 },
        { _: 'mod', modId: 'uniequip_1', to: 1 },
        { _: 'mod', modId: 'uniequip_1', to: 2 },
      ])
      expect(tasks[4].requires).toEqual([{ itemId: 'u1', quantity: 1 }])
      expect(tasks[5].requires).toEqual([{ itemId: 'u2', quantity: 2 }])
      expect(tasks[5].depends[0]).toBe(tasks[3])
      expect(tasks[5].depends[1]).toBe(tasks[4])
    })
  })

  describe('rewriteCharacter', () => {
    it('resets a status that is elite 0 level 0', () => {
      const adapter = makeAdapter()
      const s = st(-1, NaN, 0, { sk1: 1 }, { uniequip_1: 1 })
      adapter.rewriteCharacter('char_1', s)
      expect(s).toEqual({ elite: 0, level: 0, skillLevel: 1, skillMaster: {}, modLevel: {} })
    })

    it('clamps elite, level, skills and modules to valid ranges', () => {
      const adapter = makeAdapter()
      const s = st(9, 999, 9, { sk1: 5 }, { uniequip_1: 4 })
      adapter.rewriteCharacter('char_1', s)
      expect(s).toEqual({ elite: 2, level: 90, skillLevel: 7, skillMaster: { sk1: 3 }, modLevel: { uniequip_1: 3 } })
    })

    it('caps skill level at 4 before elite 1', () => {
      const adapter = makeAdapter()
      const s = st(0, 30, 5)
      adapter.rewriteCharacter('char_1', s)
      expect(s.skillLevel).toBe(4)
    })

    it('clears modules before elite 2', () => {
      const adapter = makeAdapter()
      const s = st(1, 50, 7, {}, { uniequip_1: 2 })
      adapter.rewriteCharacter('char_1', s)
      expect(s.modLevel).toEqual({})
      expect(s.skillMaster).toEqual({})
    })

    it('clears skill mastery before skill level 7', () => {
      const adapter = makeAdapter()
      const s = st(2, 50, 6, { sk1: 2 })
      adapter.rewriteCharacter('char_1', s)
      expect(s.skillMaster).toEqual({})
    })

    it('normalizes NaN levels to 1', () => {
      const adapter = makeAdapter()
      const s = st(1, NaN)
      adapter.rewriteCharacter('char_1', s)
      expect(s).toMatchObject({ elite: 1, level: 1 })
    })
  })

  describe('rewriteGoal / rewriteCharacters', () => {
    it('raises a goal that is behind the current status', () => {
      const adapter = makeAdapter()
      const current = st(2, 90, 7, { sk1: 3 }, { uniequip_1: 2 })
      const goal = st(1, 1, 1)
      adapter.rewriteGoal('char_1', current, goal)
      expect(goal).toEqual(current)
    })

    it('raises individual skill mastery and module goals', () => {
      const adapter = makeAdapter()
      const current = st(2, 90, 7, { sk1: 3 }, { uniequip_1: 2 })
      const goal = st(2, 90, 7, { sk1: 1 }, { uniequip_1: 1 })
      adapter.rewriteGoal('char_1', current, goal)
      expect(goal.skillMaster.sk1).toBe(3)
      expect(goal.modLevel.uniequip_1).toBe(2)
    })

    it('drops unknown characters', () => {
      const adapter = makeAdapter()
      expect(adapter.rewriteCharacters('nope', st(0, 1), st(0, 1))).toEqual([undefined, undefined])
    })

    it('drops the goal when it equals the current status after rewriting', () => {
      const adapter = makeAdapter()
      const current = st(1, 50)
      const goal = st(1, 10)
      const [c, g] = adapter.rewriteCharacters('char_1', current, goal)
      expect(c).toBe(current)
      expect(g).toBeUndefined()
    })

    it('drops the current status of absent characters', () => {
      const adapter = makeAdapter()
      const current = st(0, 0)
      const goal = st(1, 1)
      const [c, g] = adapter.rewriteCharacters('char_1', current, goal)
      expect(c).toBeUndefined()
      expect(g).toBe(goal)
    })
  })

  it('computes the finished status of a character', () => {
    expect(makeAdapter().finishedCharacterStatus('char_1')).toEqual({
      elite: 2,
      level: 90,
      skillLevel: 7,
      skillMaster: { sk1: 3 },
      modLevel: { uniequip_1: 3 },
    })
  })

  describe('completeTask', () => {
    it('applies every task type to the status draft', () => {
      const adapter = makeAdapter()
      let d = st()
      adapter.completeTask({ _: 'join' }, 'char_1', d)
      expect(d).toMatchObject({ elite: 0, level: 1 })

      d = st()
      adapter.completeTask({ _: 'elite', elite: 2 }, 'char_1', d)
      expect(d).toMatchObject({ elite: 2, level: 1 })

      d = st()
      adapter.completeTask({ _: 'level', elite: 1, from: 1, to: 80 }, 'char_1', d)
      expect(d).toMatchObject({ elite: 1, level: 80 })

      d = st(2, 80, 7)
      adapter.completeTask({ _: 'skill', to: 7 }, 'char_1', d)
      expect(d.skillLevel).toBe(7)

      d = st(2, 90, 7)
      adapter.completeTask({ _: 'skillMaster', skillId: 'sk1', to: 3 }, 'char_1', d)
      expect(d.skillMaster.sk1).toBe(3)

      d = st(2, 90, 7)
      adapter.completeTask({ _: 'mod', modId: 'uniequip_1', to: 3 }, 'char_1', d)
      expect(d.modLevel.uniequip_1).toBe(3)
    })
  })

  describe('formatTaskAsString', () => {
    it('formats every task type', () => {
      const adapter = makeAdapter()
      expect(adapter.formatTaskAsString({ _: 'join' }, 'char_1')).toBe('招募')
      expect(adapter.formatTaskAsString({ _: 'skill', to: 5 }, 'char_1')).toBe('技能 5 级')
      expect(adapter.formatTaskAsString({ _: 'elite', elite: 1 }, 'char_1')).toBe('精一')
      expect(adapter.formatTaskAsString({ _: 'level', elite: 1, from: 1, to: 50 }, 'char_1')).toBe('精一等级 1 -> 50')
      expect(adapter.formatTaskAsString({ _: 'skillMaster', skillId: 'sk1', to: 3 }, 'char_1')).toBe('1 技能专三: Ignition')
      expect(adapter.formatTaskAsString({ _: 'mod', modId: 'uniequip_1', to: 2 }, 'char_1')).toBe('X 模组 2 级: Module X')
    })
  })
})
