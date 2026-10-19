// Entry points for AI agents and other tools that read Markdown better than HTML.
// After the build it writes, for every docs version:
//
// - a Markdown copy of each page next to its HTML (`/guides/<path>.md`), with
//   snippets inlined and MDX components turned into plain Markdown
// - `llms.txt`, an index of the pages (https://llmstxt.org), and `llms-full.txt`,
//   all pages in one file. The stable version is served from the site root.
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { readSnippet } from './remark-snippets.mjs'

const require = createRequire(import.meta.url)

function parseFrontMatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/)
  const data = {}
  if (match) {
    for (const line of match[1].split('\n')) {
      const field = line.match(/^(\w+):\s*(.*)$/)
      if (field) data[field[1]] = field[2].trim().replace(/^(['"])(.*)\1$/, '$2')
    }
  }
  return { data, body: match ? source.slice(match[0].length) : source }
}

function sidebarEntries(items, entries = [], parent) {
  for (const item of items) {
    if (typeof item === 'string') {
      entries.push({ id: item, parent })
    } else if (item.type === 'category') {
      const id = item.link?.id
      if (id) entries.push({ id, parent, children: item.items })
      sidebarEntries(item.items, entries, id ?? parent)
    }
  }
  return entries
}

function childIds(items) {
  return items.flatMap((item) => (typeof item === 'string' ? [item] : item.link?.id ? [item.link.id] : []))
}

class DocsVersion {
  constructor(siteDir, siteUrl, version) {
    this.version = version
    this.siteUrl = siteUrl
    this.docsDir = path.join(siteDir, version.docsDir)
    const sidebarPath = path.join(siteDir, version.sidebar)
    const sidebar = sidebarPath.endsWith('.json')
      ? JSON.parse(fs.readFileSync(sidebarPath, 'utf8'))
      : require(sidebarPath)
    this.entries = sidebarEntries(Object.values(sidebar)[0])
    this.docs = new Map(
      this.entries.map((entry) => {
        const file = ['.mdx', '.md'].map((ext) => path.join(this.docsDir, entry.id + ext)).find(fs.existsSync)
        const { data, body } = parseFrontMatter(fs.readFileSync(file, 'utf8'))
        return [entry.id, { ...entry, file, body, title: data.title ?? entry.id, description: data.description }]
      })
    )
  }

  route(id) {
    const docPath = id === 'index' ? '' : id.replace(/\/index$/, '')
    return docPath ? `${this.version.routeBase}/${docPath}` : this.version.routeBase
  }

  markdownUrl(id) {
    return `${this.siteUrl}${this.route(id)}.md`
  }

  idForFile(file) {
    return path.relative(this.docsDir, file).replace(/\.mdx?$/, '')
  }

  toMarkdown(doc, { standardsMatrix, npmRange }) {
    const lines = doc.body.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').split('\n')
    const out = [`# ${doc.title}`, '']
    if (doc.description) out.push(`> ${doc.description}`, '')

    let fence
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      const fenceMatch = line.match(/^(\s*)(`{3,})(\w*)\s*(.*)$/)
      if (!fence && fenceMatch) {
        const [, indent, ticks, lang, meta] = fenceMatch
        const parts = meta.split(/\s+/)
        const file = parts.find((part) => /^[\w./-]+\.(ts|tsx|js|mjs)$/.test(part))
        if (file) {
          const section = parts.find((part) => /^section-\d+$/.test(part))?.slice('section-'.length)
          const code = readSnippet(this.version.snippets, file, section)
          out.push(
            `${indent}${ticks}${lang}`,
            ...code.split('\n').map((codeLine) => indent + codeLine),
            `${indent}${ticks}`
          )
          while (i + 1 < lines.length && !lines[i + 1].trim().startsWith(ticks)) i++
          i++
        } else {
          fence = ticks
          out.push(`${indent}${ticks}${lang}`)
        }
        continue
      }
      if (fence) {
        if (line.trim() === fence) fence = undefined
        out.push(line)
        continue
      }

      if (/^import\s.+from\s/.test(line)) continue
      if (/^\s*<\/?(Tabs|Cards)\b[^>]*>\s*$/.test(line) || /^\s*<\/TabItem>\s*$/.test(line)) continue

      const tabItem = line.match(/^\s*<TabItem\b[^>]*label="([^"]+)"[^>]*>\s*$/)
      if (tabItem) {
        out.push(`**${tabItem[1]}**`)
        continue
      }

      const install = line.match(/^\s*<InstallTabs\b([^>]*)\/>\s*$/)
      if (install) {
        const attribute = (name) => install[1].match(new RegExp(`\\b${name}="([^"]+)"`))?.[1]
        const range = npmRange[attribute('version') ?? this.version.name]
        const packages = attribute('packages')
          .trim()
          .split(/\s+/)
          .map((name) => (name.startsWith('@credo-ts/') && !name.slice(1).includes('@') ? `${name}@${range}` : name))
        const command = /\bdev\b/.test(install[1].replace(/"[^"]*"/g, '')) ? 'npm install --save-dev' : 'npm install'
        out.push('```bash', `${command} ${packages.join(' ')}`, '```')
        continue
      }

      if (/^\s*<StandardsMatrix\b[^>]*\/>\s*$/.test(line)) {
        out.push(standardsMatrix((docPath) => this.markdownUrl(docPath)))
        continue
      }

      if (/^\s*<DocCardList\s*\/>\s*$/.test(line)) {
        for (const id of childIds(doc.children ?? [])) {
          const child = this.docs.get(id)
          if (child)
            out.push(`- [${child.title}](${this.markdownUrl(id)})${child.description ? `: ${child.description}` : ''}`)
        }
        continue
      }

      const cardStart = line.match(/^\s*<Card\s+to="([^"]+)"\s+title="([^"]+)"\s*>(.*)$/)
      if (cardStart) {
        let text = cardStart[3]
        while (!text.includes('</Card>') && i + 1 < lines.length) text += ` ${lines[++i].trim()}`
        const description = text.replace('</Card>', '').trim()
        const id = this.docs.has(cardStart[1]) ? cardStart[1] : `${cardStart[1]}/index`
        out.push(`- [${cardStart[2]}](${this.markdownUrl(id)})${description ? `: ${description}` : ''}`)
        continue
      }

      out.push(
        line.replace(/\]\(((?!https?:|mailto:|#)[^)\s]+?\.mdx?)(#[^)\s]*)?\)/g, (match, target, anchor = '') => {
          const id = this.idForFile(path.resolve(path.dirname(doc.file), target))
          return this.docs.has(id) ? `](${this.markdownUrl(id)}${anchor})` : match
        })
      )
    }

    return `${out
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()}\n`
  }
}

export default function llmsPlugin(context, options) {
  const { siteDir, siteConfig } = context
  const { versions, standardsMatrix, npmRange, title, summary } = options

  return {
    name: 'llms',
    async postBuild({ outDir }) {
      const loaded = versions.map((version) => new DocsVersion(siteDir, siteConfig.url, version))

      for (const docsVersion of loaded) {
        const pages = [...docsVersion.docs.entries()].map(([id, doc]) => ({
          id,
          doc,
          markdown: docsVersion.toMarkdown(doc, { standardsMatrix, npmRange }),
        }))

        for (const { id, markdown } of pages) {
          const file = path.join(outDir, `${docsVersion.route(id)}.md`)
          fs.mkdirSync(path.dirname(file), { recursive: true })
          fs.writeFileSync(file, markdown)
        }

        const { label, llmsDir } = docsVersion.version
        const otherVersions = loaded
          .filter((other) => other !== docsVersion)
          .map((other) => `- [Credo ${other.version.label}](${siteConfig.url}${other.version.llmsDir}/llms.txt)`)

        const index = [
          `# ${title}`,
          '',
          `> ${summary}`,
          '',
          `These docs are for Credo ${label}. Every page is available as Markdown by adding \`.md\` to its URL. All pages in one file: ${siteConfig.url}${llmsDir}/llms-full.txt`,
          '',
          '## Docs',
          '',
          ...pages.map(
            ({ id, doc }) =>
              `- [${doc.title}](${docsVersion.markdownUrl(id)})${doc.description ? `: ${doc.description}` : ''}`
          ),
          '',
          '## Optional',
          '',
          ...otherVersions,
          '- [Credo on GitHub](https://github.com/openwallet-foundation/credo-ts)',
          '',
        ].join('\n')

        const full = [
          `# ${title}`,
          '',
          `> ${summary}`,
          '',
          `Credo ${label}.`,
          '',
          ...pages.map(({ markdown }) => markdown),
        ].join('\n')

        fs.mkdirSync(path.join(outDir, llmsDir), { recursive: true })
        fs.writeFileSync(path.join(outDir, llmsDir, 'llms.txt'), index)
        fs.writeFileSync(path.join(outDir, llmsDir, 'llms-full.txt'), full)
      }
    },
  }
}
