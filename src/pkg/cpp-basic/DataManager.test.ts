import { describe, expect, it } from 'vitest'
import '../testing/mockLocalforage'
import {
  CONTAINER_TYPE,
  CONTAINER_VERSION,
  DataContainerObject,
  IDataContainer,
  IDataContainerHeader,
  load,
} from '../dccache'
import { BasicDataManager } from './DataManager'

class TestDataContainer extends DataContainerObject<{ v: string }> {
  public readonly name: string
  public versionId: string
  public autoUpdateThreshold = 0
  public autoUpdateNotificationThreshold = 0

  public constructor(name: string) {
    super()
    this.name = name
    this.versionId = '1'
  }

  public async getHeader(): Promise<IDataContainerHeader> {
    return this.makeHeader()
  }

  public async getData(header: IDataContainerHeader): Promise<IDataContainer<{ v: string }>> {
    return { ...header, data: { v: this.versionId } }
  }

  private makeHeader(): IDataContainerHeader {
    return {
      '@type': CONTAINER_TYPE,
      '@version': CONTAINER_VERSION,
      name: this.name,
      version: {
        id: this.versionId,
        text: this.versionId,
        schema: 1,
        sources: ['test'],
        timestamp: Date.now(),
      },
    }
  }
}

interface TestGame {
  characterStatus: object
  characterTaskType: unknown
  preferences: object
}

class TestDataManager extends BasicDataManager<TestGame> {
  public constructor(
    public readonly game: TestDataContainer,
    public readonly stat: TestDataContainer,
  ) {
    super()
  }

  public setRegion() {
    // no-op
  }

  public async loadRaw() {
    return { game: this.game.versionId, stat: this.stat.versionId }
  }

  public async transform() {
    return { game: this.raw.game, stat: this.raw.stat }
  }

  public getRequiredDataObjects() {
    return Promise.resolve([this.game, this.stat])
  }

  public getAbsolutelyRequiredDataObjects() {
    return Promise.resolve([this.game])
  }
}

describe('BasicDataManager data update categories', () => {
  it('does not flag gamedata as updated when only statistics data updates', async () => {
    const game = new TestDataContainer('test-game')
    const stat = new TestDataContainer('test-stat')
    const dm = new TestDataManager(game, stat)

    game.autoUpdateThreshold = 86400_000 * 365
    stat.autoUpdateThreshold = 0
    await load(game, false)
    dm.initialized = true
    stat.versionId = '2'

    await dm.checkUpdates()

    expect(dm.dataUpdatedAfterInit).toBe(true)
    expect(dm.absolutelyRequiredDataUpdatedAfterInit).toBe(false)
  })

  it('flags gamedata as updated when gamedata updates', async () => {
    const game = new TestDataContainer('test-game-2')
    const stat = new TestDataContainer('test-stat-2')
    const dm = new TestDataManager(game, stat)

    game.autoUpdateThreshold = 0
    stat.autoUpdateThreshold = 86400_000 * 365
    await load(game, false)
    await load(stat, false)
    dm.initialized = true
    game.versionId = '2'

    await dm.checkUpdates(true)

    expect(dm.dataUpdatedAfterInit).toBe(true)
    expect(dm.absolutelyRequiredDataUpdatedAfterInit).toBe(true)
  })
})
