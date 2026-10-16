import { useActivePluginAndVersion } from '@docusaurus/plugin-content-docs/client'
import { credoNpmRange, stableVersion } from '@site/src/versions'
import CodeBlock from '@theme/CodeBlock'
import TabItem from '@theme/TabItem'
import Tabs from '@theme/Tabs'
import type { ReactNode } from 'react'

const packageManagers = [
  { value: 'npm', add: 'npm install', addDev: 'npm install --save-dev' },
  { value: 'pnpm', add: 'pnpm add', addDev: 'pnpm add -D' },
  { value: 'yarn', add: 'yarn add', addDev: 'yarn add -D' },
  { value: 'bun', add: 'bun add', addDev: 'bun add -d' },
]

interface InstallTabsProps {
  /** Space separated package names. `@credo-ts/*` packages get the version range of the docs version. */
  packages: string
  dev?: boolean
  /** Docs version to take the Credo range from, for use outside of the docs. */
  version?: string
}

export default function InstallTabs({ packages, dev = false, version }: InstallTabsProps): ReactNode {
  const docsVersion = useActivePluginAndVersion()?.activeVersion?.name
  const range = credoNpmRange[version ?? docsVersion ?? stableVersion]

  const names = packages
    .trim()
    .split(/\s+/)
    .map((name) => (name.startsWith('@credo-ts/') && !name.slice(1).includes('@') && range ? `${name}@${range}` : name))

  return (
    <Tabs groupId="package-manager" queryString="pm">
      {packageManagers.map((pm) => {
        const command = dev ? pm.addDev : pm.add
        const oneLine = `${command} ${names.join(' ')}`
        const text = oneLine.length <= 80 ? oneLine : `${command} \\\n  ${names.join(' \\\n  ')}`

        return (
          <TabItem key={pm.value} value={pm.value} label={pm.value}>
            <CodeBlock language="bash">{text}</CodeBlock>
          </TabItem>
        )
      })}
    </Tabs>
  )
}
