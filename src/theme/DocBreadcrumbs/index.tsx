import type { WrapperProps } from '@docusaurus/types'
import PageActions from '@site/src/components/PageActions'
import type DocBreadcrumbsType from '@theme/DocBreadcrumbs'
import DocBreadcrumbs from '@theme-original/DocBreadcrumbs'
import type { ReactNode } from 'react'
import styles from './styles.module.css'

type Props = WrapperProps<typeof DocBreadcrumbsType>

export default function DocBreadcrumbsWrapper(props: Props): ReactNode {
  return (
    <div className={styles.row}>
      <DocBreadcrumbs {...props} />
      <PageActions />
    </div>
  )
}
