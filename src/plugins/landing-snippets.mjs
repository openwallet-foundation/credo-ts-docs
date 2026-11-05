// Exposes the landing page code samples, read from the type-checked snippet
// files of the stable version, as global data.
import path from 'node:path'
import { readSnippet } from './remark-snippets.mjs'

const version = '0.7'
const samples = {
  issuer: 'landing-issuer.ts',
  holder: 'landing-holder.ts',
  verifier: 'landing-verifier.ts',
  modules: 'landing-modules.ts',
}

export default function landingSnippetsPlugin(context) {
  return {
    name: 'landing-snippets',
    async loadContent() {
      return Object.fromEntries(Object.entries(samples).map(([key, file]) => [key, readSnippet(version, file, '1')]))
    },
    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content)
    },
    getPathsToWatch() {
      return Object.values(samples).map((file) => path.join(context.siteDir, 'snippets', version, 'src', file))
    },
  }
}
