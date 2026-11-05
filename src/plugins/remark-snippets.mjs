// Inlines type-checked snippet files into code blocks at build time.
//
// ```ts showLineNumbers set-up.ts section-1
// ```
//
// reads `snippets/<version>/src/set-up.ts` and keeps the lines between the
// `start-section-1` and `end-section-1` markers. Pages under
// `versioned_docs/version-<x>/` read `snippets/<x>`, everything else reads
// `snippets/current`.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const snippetsDir = fileURLToPath(new URL('../../snippets', import.meta.url))
const snippetFile = /^[\w./-]+\.(ts|tsx|js|mjs)$/
const sectionMarker = /(start|end)-section-\d+/

export function snippetVersionForPath(filePath) {
  const match = filePath?.match(/versioned_docs[\\/]version-([^\\/]+)[\\/]/)
  return match ? match[1] : 'current'
}

export function readSnippet(version, fileName, section) {
  const snippetPath = path.join(snippetsDir, version, 'src', fileName)
  if (!fs.existsSync(snippetPath)) {
    throw new Error(`Snippet file not found: ${path.relative(process.cwd(), snippetPath)}`)
  }

  const lines = fs.readFileSync(snippetPath, 'utf8').split('\n')
  let selected = lines

  if (section !== undefined) {
    const start = lines.findIndex((line) => new RegExp(`\\bstart-section-${section}\\b`).test(line))
    const end = lines.findIndex((line) => new RegExp(`\\bend-section-${section}\\b`).test(line))
    if (start === -1 || end === -1 || end < start) {
      throw new Error(`Section ${section} not found in ${path.relative(process.cwd(), snippetPath)}`)
    }
    selected = lines.slice(start + 1, end)
  }

  return dedent(selected.filter((line) => !sectionMarker.test(line))).trimEnd()
}

function dedent(lines) {
  const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^\s*/)[0].length)
  const indent = indents.length ? Math.min(...indents) : 0
  return lines.map((line) => line.slice(indent)).join('\n')
}

function visitCode(node, callback) {
  if (node.type === 'code') callback(node)
  for (const child of node.children ?? []) visitCode(child, callback)
}

export default function remarkSnippets() {
  return (tree, file) => {
    const version = snippetVersionForPath(file.path)

    visitCode(tree, (node) => {
      if (!node.meta) return
      const parts = node.meta.split(/\s+/)
      const fileName = parts.find((part) => snippetFile.test(part))
      if (!fileName) return

      const sectionPart = parts.find((part) => /^section-\d+$/.test(part))
      node.value = readSnippet(version, fileName, sectionPart?.slice('section-'.length))
      node.meta = parts.filter((part) => part !== fileName && part !== sectionPart).join(' ') || null
    })
  }
}
