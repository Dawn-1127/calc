import { MenuItem } from '@blueprintjs/core'
import { memo, useEffect, useState } from 'react'
import { clearUserYituliuValues, getUserYituliuValues } from '../../pkg/cpp-arknights/sources'
import { gt } from '../../pkg/gt'
import { useChamber } from '../Chamber'
import { MAAItemImporterDialog } from './MAAItemImporter'
import { SklandImporterDialog } from './SklandImporter'
import { YituliuValueImporterDialog } from './YituliuValueImporter'

export const ImporterMenuItems = memo(() => {
  const { add } = useChamber()
  const [hasUserValues, setHasUserValues] = useState(false)
  useEffect(() => {
    void getUserYituliuValues().then((x) => setHasUserValues(!!x))
  }, [])

  return (
    <>
      <MenuItem icon={'log-in'} text={gt.gettext('导入「森空岛」数据')} onClick={() => add(SklandImporterDialog)} />
      <MenuItem
        icon={'log-in'}
        text={gt.gettext('导入「MAA 仓库识别」数据')}
        onClick={() => add(MAAItemImporterDialog)}
      />
      <MenuItem
        icon={'log-in'}
        text={gt.gettext('导入「一图流」物品价值')}
        onClick={() => add(YituliuValueImporterDialog)}
      />
      {hasUserValues && (
        <MenuItem
          icon={'trash'}
          text={gt.gettext('恢复默认物品价值')}
          onClick={async () => {
            await clearUserYituliuValues()
            location.reload()
          }}
        />
      )}
    </>
  )
})
