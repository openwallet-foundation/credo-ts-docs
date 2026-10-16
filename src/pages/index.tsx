import Link from '@docusaurus/Link'
import { usePluginData } from '@docusaurus/useGlobalData'
import Showcase from '@site/src/components/Showcase'
import StandardsMatrix from '@site/src/components/StandardsMatrix'
import { didMethods } from '@site/src/data/standards'
import CodeBlock from '@theme/CodeBlock'
import Layout from '@theme/Layout'
import clsx from 'clsx'
import { type ReactNode, useState } from 'react'
import styles from './index.module.css'

type LandingSnippets = Record<'issuer' | 'holder' | 'verifier' | 'modules', string>

const installCommand = 'npm install @credo-ts/core @credo-ts/node'

function Icon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

// Lucide icons (ISC license)
const iconPaths = {
  issuer: (
    <>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  holder: (
    <>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </>
  ),
  verifier: (
    <>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  mediator: (
    <>
      <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9" />
      <path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5" />
      <circle cx="12" cy="9" r="2" />
      <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47" />
      <path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1" />
      <path d="M9.5 18h5" />
      <path d="m8 22 4-11 4 11" />
    </>
  ),
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  copy: (
    <>
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  github: (
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4M9 18c-4.51 2-5-2-7-2" />
  ),
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  calendar: (
    <>
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  mail: (
    <>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
}

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button type="button" className={styles.copyCommand} onClick={copy} aria-label={`Copy "${command}"`}>
      <span className={styles.prompt} aria-hidden="true">
        $
      </span>
      <code>{command}</code>
      <span className={styles.copyIcon}>
        <Icon name={copied ? 'check' : 'copy'} />
      </span>
    </button>
  )
}

const heroTabs = [
  { id: 'issuer', label: 'Issuer', file: 'issuer.ts' },
  { id: 'holder', label: 'Holder', file: 'wallet.ts' },
  { id: 'verifier', label: 'Verifier', file: 'verifier.ts' },
] as const

function CodeWindow({ snippets }: { snippets: LandingSnippets }) {
  const [active, setActive] = useState<(typeof heroTabs)[number]['id']>('issuer')
  const tab = heroTabs.find((t) => t.id === active) ?? heroTabs[0]

  return (
    <div className={styles.codeWindow}>
      <div className={styles.codeWindowBar} role="tablist" aria-label="Code examples">
        {heroTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            className={clsx(styles.codeTab, t.id === active && styles.codeTabActive)}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
        <span className={styles.codeFile}>{tab.file}</span>
      </div>
      <div className={styles.codeBody} role="tabpanel">
        <CodeBlock language="ts">{snippets[active]}</CodeBlock>
      </div>
    </div>
  )
}

function Hero({ snippets }: { snippets: LandingSnippets }) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={clsx('container', styles.heroGrid)}>
        <div className={styles.heroText}>
          <a className={styles.eyebrow} href="https://openwallet.foundation/projects/">
            <span className={styles.eyebrowDot} aria-hidden="true" />
            An OpenWallet Foundation project
          </a>
          <h1 className={styles.heroTitle}>
            Build issuers, verifiers and wallets <span className={styles.gradientText}>in TypeScript</span>
          </h1>
          <p className={styles.heroLead}>
            Credo is an open source framework for verifiable credentials. Issue, hold and verify SD-JWT VC, mdoc, W3C
            and AnonCreds credentials over OpenID4VC and DIDComm, from one codebase on Node.js and React Native.
          </p>
          <div className={styles.heroActions}>
            <Link className="button button--primary button--lg" to="/guides/getting-started">
              Get started
            </Link>
            <Link
              className={clsx('button button--lg', styles.buttonGhost)}
              href="https://github.com/openwallet-foundation/credo-ts"
            >
              <Icon name="github" /> GitHub
            </Link>
          </div>
          <CopyCommand command={installCommand} />
          <p className={styles.agentHint}>
            Using an AI coding agent? Give it <Link to="pathname:///llms.txt">llms.txt</Link> or read{' '}
            <Link to="/guides/getting-started/ai-agents">how to point it at the docs</Link>.
          </p>
        </div>
        <CodeWindow snippets={snippets} />
      </div>
    </header>
  )
}

const standards = [
  'OpenID4VCI',
  'OpenID4VP',
  'ISO 18013-5',
  'DC API',
  'SD-JWT VC',
  'mdoc',
  'W3C VC',
  'DIDComm',
  'AnonCreds',
]

function StandardsStrip() {
  return (
    <section className={styles.strip} aria-label="Supported standards">
      <div className={clsx('container', styles.stripInner)}>
        <span className={styles.stripLabel}>Built on open standards</span>
        <ul className={styles.stripList}>
          {standards.map((standard) => (
            <li key={standard}>{standard}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function SectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className={styles.sectionHeader}>
      <p className={styles.sectionEyebrow}>{eyebrow}</p>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children && <p className={styles.sectionLead}>{children}</p>}
    </div>
  )
}

const roles = [
  {
    icon: 'issuer',
    title: 'Issuer',
    text: 'Issue credentials to any compliant wallet, with your own authorization flow, status lists and batch issuance.',
    tags: ['OpenID4VCI', 'DIDComm'],
    to: '/guides/protocols/openid4vc/issuer',
  },
  {
    icon: 'holder',
    title: 'Wallet',
    text: 'Build mobile and cloud wallets that receive, store and present credentials, online and in person, with keys in secure hardware.',
    tags: ['React Native', 'OpenID4VC', 'DIDComm'],
    to: '/guides/protocols/openid4vc/holder',
  },
  {
    icon: 'verifier',
    title: 'Verifier',
    text: 'Request exactly the claims you need with DCQL, online or through the Digital Credentials API in the browser.',
    tags: ['OpenID4VP', 'DC API'],
    to: '/guides/protocols/openid4vc/verifier',
  },
  {
    icon: 'mediator',
    title: 'Mediator',
    text: 'Run the cloud agent that queues and relays DIDComm messages for mobile wallets.',
    tags: ['DIDComm', 'Message pickup'],
    to: '/guides/protocols/didcomm/mediation',
  },
] as const

function Roles() {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader eyebrow="One framework" title="Every role in the credential ecosystem">
          Use the same agent and APIs whether you issue credentials, build a wallet or verify presentations.
        </SectionHeader>
        <div className={styles.roleGrid}>
          {roles.map((role) => (
            <Link key={role.title} to={role.to} className={clsx(styles.roleCard, styles[`role-${role.icon}`])}>
              <span className={styles.roleIcon}>
                <Icon name={role.icon} />
              </span>
              <h3>{role.title}</h3>
              <p>{role.text}</p>
              <ul className={styles.tags}>
                {role.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              <span className={styles.cardLink}>
                Start building <Icon name="arrow" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function Users() {
  return (
    <section className={clsx(styles.section, styles.sectionTinted)}>
      <div className="container">
        <SectionHeader eyebrow="In production" title="Who uses Credo">
          Platforms, wallets and apps that run on Credo today.
        </SectionHeader>
        <Showcase />
      </div>
    </section>
  )
}

function Standards() {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader eyebrow="Interoperable" title="Speaks the standards your ecosystem uses">
          Exchange protocols and credential formats are separate building blocks in Credo, so you can combine them the
          way your ecosystem requires: EUDI and mobile driving licences, Aries networks, or both.
        </SectionHeader>
        <StandardsMatrix compact />
        <div className={styles.didRow}>
          <span className={styles.didLabel}>DID methods</span>
          <ul className={styles.tags}>
            {didMethods.map((did) => (
              <li key={did.method}>{did.method}</li>
            ))}
          </ul>
          <Link className={styles.inlineLink} to="/guides/supported-standards">
            All supported standards <Icon name="arrow" />
          </Link>
        </div>
      </div>
    </section>
  )
}

const layers: { name: string; to: string; items: string[]; tone?: 'core' | 'platform' }[] = [
  { name: 'Protocols', to: '/guides/protocols', items: ['OpenID4VC', 'ISO mdoc', 'DC API', 'DIDComm'] },
  { name: 'Credential formats', to: '/guides/credential-formats', items: ['SD-JWT VC', 'mdoc', 'W3C VC', 'AnonCreds'] },
  { name: 'Agent', to: '/guides/agent-setup', items: ['Modules', 'Events', 'Multi-tenancy'], tone: 'core' },
  { name: 'Storage', to: '/guides/agent-setup/storage', items: ['Askar', 'PostgreSQL', 'SQLite'] },
  { name: 'Keys', to: '/guides/agent-setup/key-management', items: ['Askar', 'Node.js crypto', 'Secure Enclave'] },
  { name: 'Trust', to: '/guides/dids-and-trust', items: ['DIDs', 'X.509', 'Ledgers'] },
  {
    name: 'Platform',
    to: '/guides/getting-started/installation',
    items: ['Node.js', 'React Native'],
    tone: 'platform',
  },
]

function Pluggable({ code }: { code: string }) {
  return (
    <section className={clsx(styles.section, styles.sectionTinted)}>
      <div className={clsx('container', styles.split)}>
        <div>
          <SectionHeader eyebrow="Pluggable by design" title="Pick the pieces you need">
            Every capability is a module. You choose the storage, key management, DID methods and protocols your
            deployment needs.
          </SectionHeader>
          <div className={styles.codePanel}>
            <CodeBlock language="ts" title="agent.ts">
              {code}
            </CodeBlock>
          </div>
        </div>
        <nav className={styles.stack} aria-label="Credo architecture">
          {layers.map((layer) => (
            <Link
              key={layer.name}
              to={layer.to}
              className={clsx(styles.layer, layer.tone && styles[`layer-${layer.tone}`])}
            >
              <span className={styles.layerName}>{layer.name}</span>
              <span className={styles.layerItems}>
                {layer.items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}

const community = [
  {
    icon: 'github',
    title: 'GitHub',
    text: 'Source, issues and discussions',
    href: 'https://github.com/openwallet-foundation/credo-ts',
  },
  {
    icon: 'chat',
    title: 'Discord',
    text: 'Ask questions in #credo on the OpenWallet Foundation server',
    href: 'https://discord.com/channels/1022962884864643214/1179453305856991263',
  },
  {
    icon: 'calendar',
    title: 'Working group calls',
    text: 'Join the open maintainer and contributor calls',
    href: 'https://github.com/openwallet-foundation/credo-ts/wiki/Meeting-Information',
  },
  {
    icon: 'mail',
    title: 'Mailing list',
    text: 'Release news and announcements',
    href: 'https://lists.openwallet.foundation/g/credo-project',
  },
] as const

function Community() {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader eyebrow="Open source" title="Built in the open">
          Credo is an Apache 2.0 licensed project of the OpenWallet Foundation, developed by a community of maintainers
          and contributors.
        </SectionHeader>
        <div className={styles.communityGrid}>
          {community.map((item) => (
            <a key={item.title} href={item.href} className={styles.communityCard}>
              <Icon name={item.icon} />
              <span>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.cta}>
          <div>
            <h2>Set up your first agent</h2>
            <p>Install Credo, configure storage and keys, and create your first DID in a few minutes.</p>
          </div>
          <div className={styles.ctaActions}>
            <Link className="button button--primary button--lg" to="/guides/getting-started">
              Get started
            </Link>
            <Link className={clsx('button button--lg', styles.buttonGhost)} to="/guides/concepts">
              Learn the concepts
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home(): ReactNode {
  const snippets = usePluginData('landing-snippets') as LandingSnippets

  return (
    <Layout
      title="Verifiable credentials in TypeScript"
      description="Credo is an open source TypeScript framework for building issuers, verifiers and wallets for verifiable credentials, with OpenID4VC, DIDComm, SD-JWT VC, mdoc, W3C VC and AnonCreds."
    >
      <Hero snippets={snippets} />
      <main>
        <StandardsStrip />
        <Roles />
        <Users />
        <Standards />
        <Pluggable code={snippets.modules} />
        <Community />
        <FinalCta />
      </main>
    </Layout>
  )
}
