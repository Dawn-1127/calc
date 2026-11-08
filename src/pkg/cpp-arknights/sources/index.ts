import { IDataContainer } from '../../dccache'
import { CppData_ArknightsYituliuValues } from '../../cpp-data-schemas/arknights-yituliu-values'
import yituliuValues from './arknights-yituliu-values.json'

export * from './penguinTypes'
export * from './yituliuTypes'
export * from './userValues'

export function getYituliuValues(): IDataContainer<CppData_ArknightsYituliuValues> {
  return yituliuValues as any
}
