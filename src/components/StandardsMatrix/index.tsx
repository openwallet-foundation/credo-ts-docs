import Link from '@docusaurus/Link'
import { useActivePluginAndVersion } from '@docusaurus/plugin-content-docs/client'
import { formatRows, protocolColumns, protocolGroups, type Support } from '@site/src/data/standards'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './styles.module.css'

const supportLabel: Record<Support, string> = {
  yes: 'Supported',
  partial: 'Partly supported',
  no: 'Not supported',
}

function SupportMark({ support, note, showNote }: { support: Support; note?: string; showNote: boolean }) {
  const label = note ? `${supportLabel[support]}: ${note}` : supportLabel[support]
  return (
    <span className={clsx(styles.mark, styles[support])} title={label}>
      <span className="sr-only">{label}</span>
      {support === 'yes' && (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="m3.5 8.5 3 3 6-7" />
        </svg>
      )}
      {support === 'partial' && (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 8h8" />
        </svg>
      )}
      {showNote && note && support !== 'no' && <sup className={styles.noteMark}>*</sup>}
    </span>
  )
}

/** Format × protocol support matrix. Links point into the docs version you're on. */
export default function StandardsMatrix({ compact = false }: { compact?: boolean }): ReactNode {
  const versionPath = useActivePluginAndVersion()?.activeVersion?.path ?? '/guides'
  const href = (docPath: string) => `${versionPath}/${docPath}`
  const isGroupStart = (columnId: string) => {
    const index = protocolColumns.findIndex((column) => column.id === columnId)
    return index > 0 && protocolColumns[index - 1].group !== protocolColumns[index].group
  }
  const notes = formatRows.flatMap((row) =>
    protocolColumns.flatMap((column) => {
      const note = row.notes?.[column.id]
      const group = protocolGroups.find((candidate) => candidate.id === column.group)?.label
      return note && row.support[column.id] !== 'no' ? [`${row.label} with ${group} ${column.label}: ${note}.`] : []
    })
  )

  return (
    <div className={clsx(styles.wrapper, compact && styles.compact)}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th rowSpan={2} className={styles.corner}>
                Format
              </th>
              {protocolGroups.map((group) => (
                <th
                  key={group.id}
                  colSpan={protocolColumns.filter((column) => column.group === group.id).length}
                  className={styles.group}
                >
                  <Link to={href(group.docs)}>{group.label}</Link>
                </th>
              ))}
            </tr>
            <tr>
              {protocolColumns.map((column) => (
                <th key={column.id} className={clsx(styles.protocol, isGroupStart(column.id) && styles.groupStart)}>
                  <Link to={href(column.docs)}>{column.label}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {formatRows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className={styles.format}>
                  <Link to={href(row.docs)}>{row.label}</Link>
                  <code>{row.detail}</code>
                </th>
                {protocolColumns.map((column) => (
                  <td key={column.id} className={clsx(isGroupStart(column.id) && styles.groupStart)}>
                    <SupportMark support={row.support[column.id]} note={row.notes?.[column.id]} showNote={!compact} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && notes.length > 0 && (
        <ul className={styles.notes}>
          {notes.map((note) => (
            <li key={note}>* {note}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
