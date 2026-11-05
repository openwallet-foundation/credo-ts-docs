import Link from '@docusaurus/Link'
import { useActivePluginAndVersion } from '@docusaurus/plugin-content-docs/client'
import type { ReactNode } from 'react'
import styles from './styles.module.css'

interface CardProps {
  /** Doc path relative to the root of the docs version, e.g. `getting-started/installation`. */
  to: string
  title: string
  children?: ReactNode
}

/** Link card to a doc in the docs version being viewed. Looks like the cards of `<DocCardList />`. */
export function Card({ to, title, children }: CardProps): ReactNode {
  const versionPath = useActivePluginAndVersion()?.activeVersion?.path ?? '/guides'
  return (
    <article className="col col--6 margin-bottom--lg">
      <Link to={`${versionPath}/${to}`} className="card theme-doc-card-container">
        <h2 className="theme-doc-card-heading">{title}</h2>
        {children && <div className="theme-doc-card-description">{children}</div>}
      </Link>
    </article>
  )
}

export function Cards({ children }: { children: ReactNode }): ReactNode {
  return <section className={`row ${styles.cards}`}>{children}</section>
}
