import { describe, expect, it } from 'vitest'
import '../testing/mockLocalforage'
import { HeyboxSurveySource, YituliuSurveySource } from './survey'

const yituliuDm = {
  data: {
    yituliuSurvey: {
      char_1: {
        own: 0.5,
        elite: { rank0: 0.2, rank1: 0.3, rank2: 0.5 },
        skill1: { count: 100, rank1: 0.1, rank2: 0.2, rank3: 0.3 },
        modX: { count: 50, rank1: 0.1, rank2: 0.2, rank3: 0.3 },
      },
    },
  },
  raw: { yituliuSurvey: { userCount: 1000 } },
} as any

const heyboxDm = {
  data: {
    heyboxSurvey: {
      char_1: {
        o: 0.8,
        e: [0.1, 0.2, 0.7],
        e2s1: [0.4, 0.2, 0.3, 0.1],
        e2m1: [0.5, 0.3, 0.2],
        e2m2: [0.6, 0.3, 0.1],
        e2l: [0.1, 0.2, 0.7],
      },
      char_2: { o: null, e: [0, 0, 0], e2s1: [0, 0, 0, 0], e2m1: [0, 0, 0], e2l: [0, 0, 0] },
    },
  },
  raw: {},
} as any

const character = { key: 'char_1' } as any
const skill = { skillId: 'sk1' } as any
const yituliuEquip = { raw: { typeName2: 'X' } } as any

describe('YituliuSurveySource', () => {
  const source = new YituliuSurveySource(yituliuDm)

  it('returns ownership stats', () => {
    expect(source.own(character)).toEqual({ percent: 0.5, samples: 1000, desc: expect.any(String) })
    expect(source.own({ key: 'nope' } as any)).toBeNull()
  })

  it('returns elite stats based on holders', () => {
    expect(source.elite0(character)?.percent).toBe(0.2)
    expect(source.elite1(character)?.percent).toBe(0.3)
    expect(source.elite2(character)?.percent).toBe(0.5)
    expect(source.elite0(character)?.samples).toBe(500)
  })

  it('returns skill mastery stats', () => {
    const result = source.skill(character, skill, 'char_1', 0)!
    expect(result).toHaveLength(4)
    expect(result[0].percent).toBe(200)
    expect(result[1].percent).toBe(0.1 / 100)
    expect(source.skill(character, skill, 'char_1', 1)).toBeNull()
    expect(source.skill(character, skill, 'nope', 0)).toBeNull()
  })

  it('returns module stats', () => {
    const result = source.mod(character, yituliuEquip, 'char_1')!
    expect(result[0].percent).toBe(100)
    expect(source.mod(character, { raw: { typeName2: 'Y' } } as any, 'char_1')).toBeNull()
  })

  it('has no level distribution', () => {
    expect(source.e2level()).toBeUndefined()
  })
})

describe('HeyboxSurveySource', () => {
  const source = new HeyboxSurveySource(heyboxDm)

  it('returns ownership stats and null for missing data', () => {
    expect(source.own(character)?.percent).toBe(0.8)
    expect(source.own({ key: 'char_2' } as any)).toBeNull()
    expect(source.own({ key: 'nope' } as any)).toBeNull()
  })

  it('returns elite stats', () => {
    expect(source.elite0(character)?.percent).toBe(0.1)
    expect(source.elite1(character)?.percent).toBe(0.2)
    expect(source.elite2(character)?.percent).toBe(0.7)
  })

  it('returns skill mastery stats', () => {
    const result = source.skill(character, skill, 'char_1', 0)!
    expect(result[0]!.percent).toBe(0.6)
    expect(result[1]!.percent).toBeCloseTo(0.2 / 0.6)
    expect(source.skill(character, skill, 'char_1', 2)).toBeNull()
  })

  it('returns module stats from the uniequip index', () => {
    const result = source.mod(character, { key: 'uniequip_2_x' } as any, 'char_1')!
    expect(result.map((x) => x?.percent)).toEqual([undefined, 0.5, 0.3, 0.2])
    expect(source.mod(character, { key: 'uniequip_3_x' } as any, 'char_1')![1]?.percent).toBe(0.6)
    expect(source.mod(character, { key: 'uniequip_1_x' } as any, 'char_1')).toBeNull()
    expect(source.mod(character, { key: 'other' } as any, 'char_1')).toBeNull()
  })

  it('returns level distribution ranges', () => {
    expect(source.e2level(character, 1)?.percent).toBe(0.1)
    expect(source.e2level(character, 70)?.percent).toBe(0.2)
    expect(source.e2level(character, 90)?.percent).toBe(0.7)
  })

  it('returns undefined when the distribution is not finite', () => {
    const badDm = {
      data: { heyboxSurvey: { char_1: { o: 1, e: [0, 0, 1], e2s1: [0, 0, 0, 0], e2m1: [0, 0, 0], e2l: [NaN, 0.2, 0.7] } } },
      raw: {},
    } as any
    expect(new HeyboxSurveySource(badDm).e2level(character, 90)).toBeUndefined()
  })

  it('returns undefined for missing characters', () => {
    expect(source.e2level({ key: 'nope' } as any, 90)).toBeUndefined()
  })
})
