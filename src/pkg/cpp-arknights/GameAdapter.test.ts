import { describe, expect, it } from 'vitest'
import '../testing/mockLocalforage'
import { ArknightsAdapter } from './GameAdapter'
import { ArknightsRegion, PreferenceKeys, SurveySourceKey } from './types'

describe('ArknightsAdapter', () => {
  const adapter = new ArknightsAdapter()

  it('exposes the codename and regions', () => {
    expect(adapter.getCodename()).toBe('arknights')
    expect(ArknightsAdapter.getRegions().map((r) => r.id)).toEqual([
      ArknightsRegion.zh_CN,
      ArknightsRegion.en_US,
      ArknightsRegion.ja_JP,
      ArknightsRegion.ko_KR,
    ])
  })

  it('reads and writes the survey source preference with validation', () => {
    expect(adapter.readPreference(PreferenceKeys.SurveySource, {})).toBe(SurveySourceKey.None)
    expect(adapter.readPreference(PreferenceKeys.SurveySource, { surveySource: 'yituliu' })).toBe(
      SurveySourceKey.Yituliu,
    )
    expect(adapter.readPreference(PreferenceKeys.SurveySource, { surveySource: 'bogus' })).toBe(SurveySourceKey.None)
    expect(adapter.writePreference(PreferenceKeys.SurveySource, SurveySourceKey.Heybox, { a: 1 })).toEqual({
      a: 1,
      surveySource: 'heybox',
    })
  })

  it('exposes static game configuration', () => {
    expect(adapter.getFormulaTagNames()).toEqual(expect.any(Object))
    expect(adapter.getInventoryPages()).toEqual({ material: expect.any(String) })
    expect(adapter.getInventoryCategories()).toEqual(expect.any(Object))
    expect(adapter.getDefaultCharacterQueryOrder()).toEqual([
      ['rarity', 'DESC'],
      ['elite', 'DESC'],
      ['level', 'DESC'],
    ])
    expect(adapter.getFavCharacterQueryWhere()).toMatchObject({ _: 'field', field: 'elite', op: '<', operand: 2 })
    expect(Object.keys(adapter.getPredefinedQueries())).toHaveLength(10)
    expect(() => adapter.getRootCharacterQuery()).not.toThrow()
  })

  it('hides spitem souvenirs such as the hot spring resort voucher from the inventory list', () => {
    const localAdapter = new ArknightsAdapter()
    ;((localAdapter as any).dataManager as any).data = {
      items: {
        '30073': {
          key: '30073',
          raw: { itemType: 'MATERIAL', sortId: 100030, rarity: 'TIER_3' },
        },
        'ark_odc_act53side_spitem_1': {
          key: 'ark_odc_act53side_spitem_1',
          raw: { itemType: 'MATERIAL', sortId: 10606, rarity: 'TIER_5' },
        },
      },
    }

    const keys = localAdapter.getInventoryItems().map((x) => x.key)
    expect(keys).toContain('30073')
    expect(keys).not.toContain('ark_odc_act53side_spitem_1')
  })
})
