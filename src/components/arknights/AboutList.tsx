import { MenuItem } from '@blueprintjs/core'
import { memo } from 'react'
import { useGameAdapter } from '../../Cpp'
import { ArknightsDataManager } from '../../pkg/cpp-arknights'
import { HeyboxSurveySource, YituliuSurveySource } from '../../pkg/cpp-arknights/survey'
import { gt } from '../../pkg/gt'
import { DescriptionMenuItem, externalLinkProps } from '../AboutList'

export const AboutCopyright = memo(() => {
  return (
    <>
      <DescriptionMenuItem
        className="cpp-menu-not-interactive"
        icon={'info-sign'}
        text={gt.gettext('游戏资源')}
        description={gt.gettext(
          '本项目所使用的游戏资源（包括但不限于：游戏图片、动画、音频、文本原文或其转译版本等）仅用于更好地表现游戏资料、增强用户体验，其版权属于上海鹰角网络科技有限公司和其关联公司。',
        )}
      />
    </>
  )
})

export const AboutDataSources = memo(() => {
  const ga = useGameAdapter()
  const dm = ga.getDataManager() as ArknightsDataManager

  return (
    <>
      <MenuItem
        text={`${gt.gettext('Kengxxiao 解析的游戏数据')} (zh_CN)`}
        href={'https://github.com/Kengxxiao/ArknightsGameData'}
        {...externalLinkProps}
      />
      {dm.$kengxxiaoLocal ? (
        <MenuItem
          text={`${gt.gettext('Kengxxiao 解析的游戏数据')} (${dm.$kengxxiaoLocal.lang})`}
          href={'https://github.com/Kengxxiao/ArknightsGameData'}
          {...externalLinkProps}
        />
      ) : null}
      <MenuItem
        text={`${gt.gettext('企鹅物流数据统计 素材掉落统计数据')} (${dm.$penguin.server})`}
        href={'https://penguin-stats.io/'}
        {...externalLinkProps}
      />
      <MenuItem
        text={gt.gettext('明日方舟一图流 材料价值数据')}
        href={'https://ark.yituliu.cn/'}
        {...externalLinkProps}
      />
      <MenuItem
        text={`${YituliuSurveySource.Name}`}
        href={YituliuSurveySource.URL}
        {...externalLinkProps}
      />
      <MenuItem
        text={`${HeyboxSurveySource.Name}`}
        href={HeyboxSurveySource.URL}
        {...externalLinkProps}
      />
    </>
  )
})

export const AboutThirdParty = memo(() => {
  return (
    <>
      <MenuItem
        icon={'media'}
        text="yuanyan3060/Arknights-Bot-Resource"
        href={'https://github.com/yuanyan3060/Arknights-Bot-Resource'}
        {...externalLinkProps}
      />
      <MenuItem
        icon={'media'}
        text="PuppiizSunniiz/Arknight-Images"
        href={'https://github.com/PuppiizSunniiz/Arknight-Images'}
        {...externalLinkProps}
      />
    </>
  )
})

export const AboutCredits = memo(() => {
  return (
    <>
      <DescriptionMenuItem
        icon={'person'}
        text="GhostShe11"
        href={'https://www.bilibili.com/read/cv25970558/'}
        {...externalLinkProps}
        description={gt.pgettext('credit role', '矢量图标绘制')}
      />
    </>
  )
})
