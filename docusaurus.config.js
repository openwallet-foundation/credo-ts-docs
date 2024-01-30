// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')
const remarkTabs = require('remark-docusaurus-tabs')
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Credo',
  tagline: 'Everything you need to know about the Credo ecosystem.',
  url: 'https://credo.js.org',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  themes: ['@docusaurus/theme-mermaid'],

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'openwallet-foundation', // Usually your GitHub org/user name.
  projectName: 'credo-ts-docs', // Usually your repo name.
  trailingSlash: false,

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  // i18n: {
  //   defaultLocale: "en",
  //   locales: ["en"],
  // },
  markdown: {
    mermaid: true,
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          path: 'guides',
          routeBasePath: 'guides',
          sidebarPath: require.resolve('./sidebars.js'),
          remarkPlugins: [remarkTabs],
          admonitions: {
            tag: ':::',
            keywords: ['note', 'tip', 'info', 'caution', 'danger', 'issuer', 'verifier', 'holder', 'bob', 'acme'],
          },
          lastVersion: '0.4',
          versions: {
            current: {
              label: 'v0.5.x',
              path: '0.5',
              banner: 'unreleased',
            },
            0.4: {
              label: 'v0.4.x',
            },
            0.3: {
              label: 'v0.3.x',
            },
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/aries-social-preview-layered.png',
      navbar: {
        title: 'Credo Docs',
        logo: {
          alt: 'Hyperledger Aries Logo',
          src: 'img/aries-logo.png',
        },
        items: [
          {
            type: 'docsVersionDropdown',
            position: 'right',
          },
          {
            to: '/guides',
            type: 'doc',
            docId: 'index',
            position: 'left',
            label: 'Guides',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Guides',
            items: [
              {
                label: 'Concepts',
                to: '/guides/concepts',
              },
              {
                label: 'Tutorials',
                to: '/guides/tutorials',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.com/channels/1022962884864643214/1179453305856991263',
              },
              {
                label: 'Working Group Call Notes',
                href: 'https://github.com/openwallet-foundation/credo-ts/wiki/Meeting-Information',
              },
            ],
          },
          {
            title: 'Repositories',
            items: [
              {
                label: 'Credo',
                href: 'https://github.com/openwallet-foundation/credo-ts',
              },
              {
                label: 'Credo Extensions',
                href: 'https://github.com/openwallet-foundation/credo-ts-ext',
              },
              {
                label: 'Credo Docs (this site)',
                href: 'https://github.com/openwallet-foundation/credo-ts-docs',
              },
            ],
          },
        ],
        // copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
  plugins: [
    [
      require.resolve('@cmfcmf/docusaurus-search-local'),
      {
        indexDocs: true,
        indexDocSidebarParentCategories: 3,
        lunr: {
          // When indexing your documents, their content is split into "tokens".
          // Text entered into the search box is also tokenized.
          // This setting configures the separator used to determine where to split the text into tokens.
          // By default, it splits the text at whitespace and dashes.
          //
          // Note: Does not work for "ja" and "th" languages, since these use a different tokenizer.
          tokenizerSeparator: /[\s\-]+/,
          // https://lunrjs.com/guides/customising.html#similarity-tuning
          //
          // This parameter controls the importance given to the length of a document and its fields. This
          // value must be between 0 and 1, and by default it has a value of 0.75. Reducing this value
          // reduces the effect of different length documents on a term’s importance to that document.
          b: 0.75,
          // This controls how quickly the boost given by a common word reaches saturation. Increasing it
          // will slow down the rate of saturation and lower values result in quicker saturation. The
          // default value is 1.2. If the collection of documents being indexed have high occurrences
          // of words that are not covered by a stop word filter, these words can quickly dominate any
          // similarity calculation. In these cases, this value can be reduced to get more balanced results.
          k1: 1.2,
          // By default, we rank pages where the search term appears in the title higher than pages where
          // the search term appears in just the text. This is done by "boosting" title matches with a
          // higher value than content matches. The concrete boosting behavior can be controlled by changing
          // the following settings.
          titleBoost: 10,
          contentBoost: 1,
          parentCategoriesBoost: 2, // Only used when indexDocSidebarParentCategories > 0
        },
      },
    ],
  ],
}

module.exports = config
