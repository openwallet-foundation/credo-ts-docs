import type * as Preset from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'
import { standardsMatrixMarkdown } from './src/data/standards'
import landingSnippets from './src/plugins/landing-snippets.mjs'
import llms from './src/plugins/llms.mjs'
import remarkSnippets from './src/plugins/remark-snippets.mjs'
import { credoDark, credoLight } from './src/prism-themes'
import { credoNpmRange } from './src/versions'

// Pages that moved in the 0.7 docs restructure. The 0.5 docs used the same paths under `/guides/0.5`.
const movedPages: Record<string, string> = {
  '/getting-started/prerequisites': '/getting-started/installation',
  '/getting-started/set-up': '/getting-started/first-agent',
  '/getting-started/set-up/aries-askar': '/agent-setup/storage/askar',
  '/getting-started/set-up/anoncreds': '/credential-formats/anoncreds',
  '/getting-started/set-up/indy-vdr': '/dids-and-trust/indy-vdr',
  '/getting-started/set-up/cheqd': '/dids-and-trust/cheqd',
  '/getting-started/set-up/hedera': '/dids-and-trust/hedera',
  '/getting-started/set-up/openid4vc': '/protocols/openid4vc',
  '/tutorials': '/protocols',
  '/tutorials/agent-config': '/agent-setup',
  '/tutorials/agent-config/logging': '/agent-setup/logging',
  '/tutorials/create-a-connection': '/protocols/didcomm/connections',
  '/tutorials/registering-schema-and-credential-definition': '/credential-formats/anoncreds',
  '/tutorials/issue-an-anoncreds-credential-over-didcomm': '/protocols/didcomm/anoncreds',
  '/tutorials/mediation': '/protocols/didcomm/mediation',
  '/tutorials/cheqd': '/dids-and-trust/cheqd',
  '/tutorials/hedera': '/dids-and-trust/hedera',
  '/tutorials/openid4vc': '/protocols/openid4vc',
  '/tutorials/openid4vc/issuing-credentials-using-openid4vc-issuer-module': '/protocols/openid4vc/issuer',
  '/tutorials/openid4vc/receiving-and-proving-credentials-using-openid4vc-holder-module':
    '/protocols/openid4vc/receive',
  '/tutorials/openid4vc/verifying-credentials-using-openid4vc-verifier-module': '/protocols/openid4vc/verifier',
  '/features': '/supported-standards',
  '/features/aries': '/protocols/didcomm',
  '/features/openid4vc': '/protocols/openid4vc',
  '/features/dids': '/dids-and-trust',
  '/features/credentials': '/credential-formats',
  '/protocols/openid4vc/dc-api': '/protocols/dc-api',
  '/protocols/mdoc/dc-api': '/protocols/dc-api',
}

const redirects = [
  { from: '/guides/0.5', to: '/guides' },
  { from: '/guides/0.6', to: '/guides' },
  ...Object.entries(movedPages).flatMap(([from, to]) => [
    { from: `/guides${from}`, to: `/guides${to}` },
    { from: `/guides/0.5${from}`, to: `/guides${to}` },
    { from: `/guides/next${from}`, to: `/guides/next${to}` },
  ]),
]

const config: Config = {
  title: 'Credo',
  tagline: 'Build issuers, verifiers and wallets for verifiable credentials in TypeScript.',
  url: 'https://credo.js.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',

  organizationName: 'openwallet-foundation',
  projectName: 'credo-ts-docs',
  trailingSlash: false,

  future: {
    v4: true,
    faster: true,
  },

  themes: ['@docusaurus/theme-mermaid'],
  clientModules: ['./src/client/fonts.ts'],
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'guides',
          routeBasePath: 'guides',
          sidebarPath: 'sidebars.js',
          editUrl: 'https://github.com/openwallet-foundation/credo-ts-docs/edit/main/',
          beforeDefaultRemarkPlugins: [remarkSnippets],
          admonitions: {
            keywords: ['note', 'tip', 'info', 'warning', 'caution', 'danger', 'issuer', 'verifier', 'holder'],
          },
          lastVersion: '0.7',
          versions: {
            current: {
              label: '0.8 (next)',
              path: 'next',
              banner: 'unreleased',
              badge: true,
            },
            '0.7': {
              label: '0.7',
              banner: 'none',
              badge: true,
            },
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    landingSnippets,
    [
      llms,
      {
        title: 'Credo',
        summary:
          'Credo is an open source TypeScript framework for verifiable credentials. It is used to build issuers, verifiers, wallets and mediators that exchange SD-JWT VC, mdoc, W3C and AnonCreds credentials over OpenID4VC and DIDComm, on Node.js and React Native.',
        npmRange: credoNpmRange,
        standardsMatrix: standardsMatrixMarkdown,
        versions: [
          {
            name: '0.7',
            label: '0.7 (stable)',
            docsDir: 'versioned_docs/version-0.7',
            sidebar: 'versioned_sidebars/version-0.7-sidebars.json',
            routeBase: '/guides',
            snippets: '0.7',
            llmsDir: '',
          },
          {
            name: 'current',
            label: '0.8 (next, unreleased)',
            docsDir: 'guides',
            sidebar: 'sidebars.js',
            routeBase: '/guides/next',
            snippets: 'current',
            llmsDir: '/guides/next',
          },
        ],
      },
    ],
    ['@docusaurus/plugin-client-redirects', { redirects }],
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        docsDir: 'guides',
        docsRouteBasePath: 'guides',
        indexBlog: false,
        indexPages: false,
        // The plugin starts each result's breadcrumb with the first active navbar link. All navbar doc links
        // share one sidebar, so they are all active and every result would start with "Get started".
        ignoreCssSelectors: ['.navbar'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        searchBarShortcutHint: true,
      },
    ],
  ],

  themeConfig: {
    image: 'img/credo-social-preview.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'Credo',
      logo: {
        alt: 'Credo logo',
        src: 'img/credo-mark.png',
        width: 37,
        height: 26,
      },
      items: [
        { type: 'doc', docId: 'getting-started/index', position: 'left', label: 'Get started' },
        { type: 'doc', docId: 'protocols/index', position: 'left', label: 'Protocols' },
        { type: 'doc', docId: 'credential-formats/index', position: 'left', label: 'Credential formats' },
        { type: 'doc', docId: 'supported-standards', position: 'left', label: 'Standards' },
        { type: 'docsVersionDropdown', position: 'right' },
        {
          href: 'https://github.com/openwallet-foundation/credo-ts',
          position: 'right',
          className: 'navbar-icon navbar-icon--github',
          html: '<span class="sr-only">Credo on GitHub</span>',
        },
        {
          href: 'https://discord.com/channels/1022962884864643214/1179453305856991263',
          position: 'right',
          className: 'navbar-icon navbar-icon--discord',
          html: '<span class="sr-only">Credo on Discord</span>',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Get started', to: '/guides/getting-started' },
            { label: 'Protocols', to: '/guides/protocols' },
            { label: 'Credential formats', to: '/guides/credential-formats' },
            { label: 'Updating', to: '/guides/updating' },
            { label: 'llms.txt', href: 'pathname:///llms.txt' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'Discord', href: 'https://discord.com/channels/1022962884864643214/1179453305856991263' },
            { label: 'Mailing list', href: 'https://lists.openwallet.foundation/g/credo-project' },
            {
              label: 'Working group calls',
              href: 'https://github.com/openwallet-foundation/credo-ts/wiki/Meeting-Information',
            },
          ],
        },
        {
          title: 'Repositories',
          items: [
            { label: 'Credo', href: 'https://github.com/openwallet-foundation/credo-ts' },
            { label: 'Credo extensions', href: 'https://github.com/openwallet-foundation/credo-ts-ext' },
            { label: 'Credo docs', href: 'https://github.com/openwallet-foundation/credo-ts-docs' },
          ],
        },
        {
          title: 'OpenWallet Foundation',
          items: [
            { label: 'openwallet.foundation', href: 'https://openwallet.foundation' },
            { label: 'Projects', href: 'https://openwallet.foundation/projects/' },
          ],
        },
      ],
      copyright: 'Credo is an OpenWallet Foundation project, licensed under Apache 2.0.',
    },
    prism: {
      theme: credoLight,
      darkTheme: credoDark,
      additionalLanguages: ['json', 'diff', 'bash', 'tsx'],
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
  } satisfies Preset.ThemeConfig,
}

export default config
