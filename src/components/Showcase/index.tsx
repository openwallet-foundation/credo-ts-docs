import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import { type CredoUser, credoUsers } from '@site/src/data/users'
import ThemedImage from '@theme/ThemedImage'
import type { ReactNode } from 'react'
import styles from './styles.module.css'

function UserCard({ user }: { user: CredoUser }) {
  const light = useBaseUrl(user.logo.light)
  const dark = useBaseUrl(user.logo.dark ?? user.logo.light)

  return (
    <div className={styles.card}>
      <div className={styles.logo}>
        <ThemedImage alt={`${user.name} logo`} sources={{ light, dark }} height={user.logo.height ?? 36} />
      </div>
      <div className={styles.meta}>
        <h3>{user.name}</h3>
        {user.by && <span className={styles.by}>by {user.by}</span>}
      </div>
      <p>{user.description}</p>
      <ul className={styles.tags}>
        {user.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      <div className={styles.links}>
        {/* The main link covers the whole card, the other links sit above it */}
        <a className={`${styles.link} ${styles.mainLink}`} href={user.url}>
          {user.linkLabel ?? new URL(user.url).hostname.replace(/^www\./, '')} ↗
        </a>
        {user.links?.map((link) => (
          <a key={link.url} className={styles.link} href={link.url}>
            {link.label} ↗
          </a>
        ))}
      </div>
    </div>
  )
}

/** "Who uses Credo" cards. Entries come from `src/data/users.ts`. */
export default function Showcase(): ReactNode {
  return (
    <div>
      <div className={styles.grid}>
        {credoUsers.map((user) => (
          <UserCard key={user.name} user={user} />
        ))}
      </div>
      <p className={styles.addYours}>
        Building with Credo?{' '}
        <Link href="https://github.com/openwallet-foundation/credo-ts-docs/edit/main/src/data/users.ts">
          Add your project
        </Link>
        .
      </p>
    </div>
  )
}
