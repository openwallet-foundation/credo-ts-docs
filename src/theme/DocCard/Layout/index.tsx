import Link from '@docusaurus/Link'
import { ThemeClassNames } from '@docusaurus/theme-common'
import Description from '@theme/DocCard/Description'
import Heading from '@theme/DocCard/Heading'
import type { Props } from '@theme/DocCard/Layout'
import clsx from 'clsx'
import type { ReactNode } from 'react'

// Same as the original layout, without Infima's `padding--lg` utility (its
// !important padding can't be overridden from the theme CSS).
export default function DocCardLayout({ item, className, href, icon, title, description }: Props): ReactNode {
  return (
    <Link href={href} className={clsx('card', ThemeClassNames.docs.docCard.container, className)}>
      <Heading item={item} icon={icon} title={title} />
      {description && <Description item={item} description={description} />}
    </Link>
  )
}
