import { Link } from 'react-router'
import { ChevronRightIcon, InfoIcon } from '../../components/icons'
import { splitBold } from '../../help/inline'
import type { HelpBlock, HelpText } from '../../help/types'
import { useTranslation } from '../../i18n/useTranslation'

/** Handbook text with its `**bold**` names of buttons, fields and pages. */
export function HelpInline({ text }: { text: HelpText }) {
  return splitBold(text).map((part, index) =>
    part.bold ? <strong key={index}>{part.text}</strong> : part.text,
  )
}

function Block({ block }: { block: HelpBlock }) {
  const { t } = useTranslation()
  switch (block.type) {
    case 'paragraph':
      return (
        <p>
          <HelpInline text={block.text} />
        </p>
      )
    case 'steps':
      return (
        <ol className="help-steps">
          {block.items.map((item, index) => (
            <li key={index}>
              <HelpInline text={item} />
            </li>
          ))}
        </ol>
      )
    case 'list':
      return (
        <ul className="help-list">
          {block.items.map((item, index) => (
            <li key={index}>
              <HelpInline text={item} />
            </li>
          ))}
        </ul>
      )
    case 'note':
      return (
        <div className="help-note" role="note">
          <InfoIcon className="help-note__icon" />
          <p>
            <strong>{t('help.note')}:</strong> <HelpInline text={block.text} />
          </p>
        </div>
      )
    case 'link':
      return (
        <p>
          <Link to={block.to} className="help-app-link">
            {block.label}
            <ChevronRightIcon width={16} height={16} />
          </Link>
        </p>
      )
  }
}

export function HelpBlocks({ blocks }: { blocks: HelpBlock[] }) {
  return blocks.map((block, index) => <Block key={index} block={block} />)
}
