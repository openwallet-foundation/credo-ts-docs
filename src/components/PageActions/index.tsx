import Head from '@docusaurus/Head'
import { useDoc } from '@docusaurus/plugin-content-docs/client'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { type ReactNode, useState } from 'react'
import styles from './styles.module.css'

const icons = {
  copy: (
    <>
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  chevron: <path d="m6 9 6 6 6-6" />,
}

function Icon({ name }: { name: keyof typeof icons }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

/** Copy the page as Markdown, or open it in an AI assistant. The Markdown files are written by the llms plugin. */
export default function PageActions(): ReactNode {
  const { metadata } = useDoc()
  const { siteConfig } = useDocusaurusContext()
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const markdownPath = `${metadata.permalink}.md`
  const markdownUrl = `${siteConfig.url}${markdownPath}`
  const prompt = encodeURIComponent(`Read ${markdownUrl} so I can ask questions about it.`)

  const copy = async () => {
    try {
      const response = await fetch(markdownPath)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      await navigator.clipboard.writeText(await response.text())
      setState('copied')
    } catch {
      setState('failed')
    }
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <div className={styles.actions}>
      <Head>
        <link rel="alternate" type="text/markdown" href={markdownPath} />
      </Head>
      <button type="button" className={styles.button} onClick={copy}>
        <Icon name={state === 'copied' ? 'check' : 'copy'} />
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy page'}
      </button>
      <details className={styles.menu}>
        <summary className={styles.button} aria-label="More page actions">
          <Icon name="chevron" />
        </summary>
        <ul>
          <li>
            <a href={markdownPath} target="_blank" rel="noreferrer">
              View as Markdown
            </a>
          </li>
          <li>
            <a href={`https://claude.ai/new?q=${prompt}`} target="_blank" rel="noreferrer">
              Open in Claude
            </a>
          </li>
          <li>
            <a href={`https://chatgpt.com/?q=${prompt}`} target="_blank" rel="noreferrer">
              Open in ChatGPT
            </a>
          </li>
        </ul>
      </details>
    </div>
  )
}
