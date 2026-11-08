import { IGameComponent } from './components/types'
import { IGame, IGameAdapter } from './pkg/cpp-basic'

export const enum GameName {
  Arknights = 'arknights',
}

export const gameAdapterLoaders = {
  [GameName.Arknights]: async () => new (await import('./pkg/cpp-arknights')).ArknightsAdapter(),
} satisfies Record<GameName, () => Promise<IGameAdapter<IGame>>>

export const gameComponentLoaders = {
  [GameName.Arknights]: async () => (await import('./components/arknights')).ArknightsComponents,
} satisfies Record<GameName, () => Promise<IGameComponent>>
