import { Card, CardList, Dialog, DialogBody, Icon } from '@blueprintjs/core'
import { memo, useRef, useState } from 'react'
import useEvent from 'react-use-event-hook'
import { saveUserYituliuValues } from '../../pkg/cpp-arknights/sources'
import type { YituliuValue } from '../../pkg/cpp-arknights/sources'
import { gt } from '../../pkg/gt'
import { AppToaster } from '../Toaster'

export const YituliuValueImporterDialog = memo(({ onClose }: { onClose: () => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleData = useEvent(async (input: string) => {
    const toaster = await AppToaster
    try {
      const data = JSON.parse(input)
      if (!Array.isArray(data)) {
        throw new Error('Data is not an array')
      }

      const values: YituliuValue[] = data.map((x: YituliuValue) => ({
        id: String(x.id),
        name: String(x.name),
        apValue: Number(x.apValue),
        rarity: Number(x.rarity),
      }))

      await saveUserYituliuValues({ values })

      toaster.show({
        message: gt.gettext('导入成功，正在重载...'),
        intent: 'success',
      })
      onClose()

      setTimeout(() => {
        location.reload()
      }, 500)
    } catch (e) {
      console.error(e)
      toaster.show({
        message: gt.gettext('导入失败，请检查数据格式'),
        intent: 'danger',
      })
    }
  })

  const handleFile = useEvent(async (file: File | undefined) => {
    if (!file) return
    const toaster = await AppToaster
    if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
      toaster.show({
        message: gt.gettext('请选择「一图流」导出的 JSON 文件'),
        intent: 'danger',
      })
      return
    }
    try {
      void handleData(await file.text())
    } catch (e) {
      console.error(e)
      toaster.show({
        message: gt.gettext('读取文件失败，请重试'),
        intent: 'danger',
      })
    }
  })

  const handleDrop = useEvent<React.DragEventHandler<HTMLDivElement>>((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    void handleFile(e.dataTransfer.files?.[0])
  })

  const handleDragOver = useEvent<React.DragEventHandler<HTMLDivElement>>((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  })

  const handleDragLeave = useEvent<React.DragEventHandler<HTMLDivElement>>((e) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  })

  return (
    <Dialog isOpen={true} onClose={onClose} title={gt.gettext('导入「一图流」物品价值')} icon="log-in">
      <DialogBody>
        <CardList compact>
          <MyCard step={1}>{gt.pgettext('arknights yituliu import step', '从一图流导出 JSON 文件')}</MyCard>
          <MyCard step={2}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75em',
                padding: '2em 1em',
                border: `2px dashed ${dragging ? '#2d72d4' : 'rgba(120, 120, 120, 0.6)'}`,
                borderRadius: '0.5em',
                cursor: 'pointer',
                textAlign: 'center',
                outline: 'none',
              }}
            >
              <Icon icon="cloud-upload" size={40} />
              <span>{gt.gettext('将「一图流」导出的 JSON 文件拖到此处')}</span>
              <span style={{ opacity: 0.6 }}>{gt.gettext('或点击此处选择文件')}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    void handleFile(file)
                  }
                  e.target.value = ''
                }}
              />
            </div>
          </MyCard>
        </CardList>
      </DialogBody>
    </Dialog>
  )
})

const MyCard = memo((props: { children: React.ReactNode; step: number }) => {
  return (
    <Card>
      <span style={{ fontSize: '1.5em', marginRight: '1em' }}>{props.step}</span>
      {props.children}
    </Card>
  )
})
