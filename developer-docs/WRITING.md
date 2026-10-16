# Writing docs

## Versions

The site has two doc versions:

| Version | Pages | Snippets | URL |
| --- | --- | --- | --- |
| Next (unreleased, currently 0.8) | `guides/` | `snippets/current/` | `/guides/next/...` |
| Stable (currently 0.7) | `versioned_docs/version-0.7/` | `snippets/0.7/` | `/guides/...` |

A change that applies to both versions goes into both trees. Each tree describes only its own version; migration guides under `updating/versions/` describe the differences. The sidebar of the next version is `sidebars.js`, the stable one `versioned_sidebars/version-0.7-sidebars.json`.

When a new version is released, snapshot it with `pnpm docusaurus docs:version <version>`, copy `snippets/current` to `snippets/<version>`, and update `lastVersion` and `versions` in `docusaurus.config.ts` and the npm ranges in `src/versions.ts`.

## Snippets

Code examples live in TypeScript files under `snippets/<version>/src/`, so they are type-checked (`pnpm types:check`) and can be run. A code block pulls a file, or a section of it, in at build time:

````md
```ts showLineNumbers title="agent.ts" first-agent.ts section-1
```
````

Mark sections in the snippet file with comments. Sections may nest, and markers are removed from the output:

```ts
// start-section-1
const agent = new Agent({ ... })
// end-section-1
```

Without `section-N` the whole file is shown. A missing file or section fails the build. Pages under `versioned_docs/version-<x>/` read `snippets/<x>/`, pages under `guides/` read `snippets/current/`.

Write snippets as the code you would want users to copy: self-contained, typed, no casts to silence errors, comments only where they explain a why. Run a Node snippet from its package:

```bash
cd snippets/0.7
pnpm tsx src/first-agent.ts
```

## Components

These are available in every page without an import:

- `<InstallTabs packages="@credo-ts/core @credo-ts/node" />` renders npm, pnpm, yarn and bun commands, with the Credo version range of the docs version appended to `@credo-ts/*` packages.
- `<Tabs groupId="platform" queryString>` with `<TabItem value="node" label="Node.js">` and `<TabItem value="react-native" label="React Native">`. Use these exact values so the platform choice syncs across pages.
- `<Cards>` with `<Card to="getting-started/installation" title="Installation">Description</Card>`, linking to a page in the current docs version. `<DocCardList />` lists the pages of the current category.
- `<StandardsMatrix />`, the format and protocol support table, generated from `src/data/standards.ts`. The landing page uses the same data.
- Admonitions: `:::note`, `:::tip`, `:::info`, `:::warning`, `:::danger`, and `:::issuer`, `:::holder`, `:::verifier` to mark which party runs a piece of code.

Link to other pages with relative file links including the extension (`[Askar](../agent-setup/storage/askar.mdx)`), so links resolve within the version. Pages are MDX: use `{/* */}` for comments, not `<!-- -->`.

## Style

Write for TypeScript developers who may be new to verifiable credentials. Say what something does, how to use it, and the caveat that would surprise someone. Keep pages short and link to related pages instead of repeating them.
