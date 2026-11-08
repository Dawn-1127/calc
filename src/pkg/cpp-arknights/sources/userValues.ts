import localForage from 'localforage'
import { CONTAINER_TYPE, CONTAINER_VERSION, IDataContainer } from '../../dccache'
import { CppData_ArknightsYituliuValues } from '../../cpp-data-schemas/arknights-yituliu-values'

const store = localForage.createInstance({
  name: 'cpp_user_arknights_yituliu_values_v2',
})

const KEY = 'values'

let cache: IDataContainer<CppData_ArknightsYituliuValues> | null | undefined

export async function getUserYituliuValues(): Promise<IDataContainer<CppData_ArknightsYituliuValues> | null> {
  if (cache === undefined) {
    cache = (await store.getItem<IDataContainer<CppData_ArknightsYituliuValues>>(KEY)) ?? null
  }
  return cache
}

export async function saveUserYituliuValues(data: CppData_ArknightsYituliuValues) {
  const container: IDataContainer<CppData_ArknightsYituliuValues> = {
    '@type': CONTAINER_TYPE,
    '@version': CONTAINER_VERSION,
    name: 'arknights-yituliu-values',
    version: {
      id: 'user-import-' + Date.now(),
      text: 'User Import',
      timestamp: Date.now(),
      sources: [],
      schema: 2,
    },
    data,
  }
  cache = container
  await store.setItem(KEY, container)
}

export async function clearUserYituliuValues() {
  cache = null
  await store.removeItem(KEY)
}
