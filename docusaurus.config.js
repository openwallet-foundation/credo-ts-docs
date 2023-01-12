// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')
const admonitions = require('remark-admonitions')
const remarkTabs = require('remark-docusaurus-tabs')
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Aries JavaScript Documentation',
  tagline: 'Everything you need to know about the Aries JavaScript ecosystem.',
  url: 'https://aries.js.org',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'hyperledger', // Usually your GitHub org/user name.
  projectName: 'aries-javascript-docs', // Usually your repo name.
  trailingSlash: false,

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  // i18n: {
  //   defaultLocale: "en",
  //   locales: ["en"],
  // },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          path: 'guides',
          routeBasePath: 'guides',
          sidebarPath: require.resolve('./sidebars.js'),
          remarkPlugins: [
            remarkTabs,
            [
              admonitions,
              {
                infima: true,
                icons: 'emoji',
                customTypes: {
                  holder: {
                    keyword: 'issuer',
                    emoji: '🗄',
                    ifmClass: 'alert alert--holder',
                  },
                  issuer: {
                    keyword: 'issuer',
                    emoji: '📄',
                    ifmClass: 'alert alert--issuer',
                  },
                  verifier: {
                    keyword: 'verifier',
                    emoji: '👮',
                    ifmClass: 'alert alert--verifier',
                  },
                  acme: {
                    keyword: 'Acme Corp',
                    emoji: '🏢',
                    ifmClass: 'alert alert--acme',
                  },
                  bob: {
                    keyword: 'Bob',
                    emoji: '🧔',
                    ifmClass: 'alert alert--bob',
                  },
                },
              },
            ],
          ],
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
        title: 'Aries JavaScript Docs',
        logo: {
          alt: 'Hyperledger Aries Logo',
          src: 'img/aries-logo.png',
        },
        items: [
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
                href: 'https://discord.com/channels/905194001349627914/941708033434738768',
              },
              {
                label: 'Hyperledger Aries Mailing List',
                href: 'https://lists.hyperledger.org/g/aries',
              },
              {
                label: 'Working Group Call Notes',
                href: 'https://wiki.hyperledger.org/display/ARIES/Framework+JS+Meetings',
              },
              {
                label: 'Working Group Call Calendar',
                href: 'https://lists.hyperledger.org/login?r=https%3A%2F%2Flists.hyperledger.org%2Fg%2Faries%2Fcalendar',
              },
            ],
          },
          {
            title: 'Repositories',
            items: [
              {
                label: 'Aries Framework JavaScript',
                href: 'https://github.com/hyperledger/aries-framework-javascript',
              },
              {
                label: 'Aries Framework JavaScript Extensions',
                href: 'https://github.com/hyperledger/aries-framework-javascript-ext',
              },
              {
                label: 'Aries JavaScript Docs (this site)',
                href: 'https://github.com/hyperledger/aries-javascript-docs',
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
