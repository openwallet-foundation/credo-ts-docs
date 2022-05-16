// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Aries JavaScript Documentation",
  tagline: "Documentation",
  url: "aries.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "hyperledger", // Usually your GitHub org/user name.
  projectName: "aries-javascript-docs", // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: "guide",
          routeBasePath: "guide",
          sidebarPath: require.resolve("./sidebars.js"),
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "Aries JavaScript Docs",
        logo: {
          alt: "Hyperledger Aries Logo",
          src: "img/aries-logo.png",
        },
        items: [
          {
            to: "/guide",
            type: "doc",
            docId: "index",
            position: "left",
            label: "Guide",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Guide",
            items: [
              {
                label: "Concepts",
                to: "/guide/concepts/index",
              },
              {
                label: "Tutorials",
                to: "/guide/tutorials/index",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "https://discord.com/channels/905194001349627914/941708033434738768",
              },
              {
                label: "Hyperledger Aries Mailing List",
                href: "https://lists.hyperledger.org/g/aries",
              },
              {
                label: "Working Group Call Notes",
                href: "https://wiki.hyperledger.org/display/ARIES/Framework+JS+Meetings",
              },
              {
                label: "Working Group Call Calendar",
                href: "https://lists.hyperledger.org/login?r=https%3A%2F%2Flists.hyperledger.org%2Fg%2Faries%2Fcalendar",
              },
            ],
          },
          {
            title: "Repositories",
            items: [
              {
                label: "Aries Framework JavaScript",
                href: "https://github.com/hyperledger/aries-framework-javascript",
              },
              {
                label: "Aries Framework JavaScript Extensions",
                href: "https://github.com/hyperledger/aries-framework-javascript-ext",
              },
              {
                label: "Aries JavaScript Docs (this site)",
                href: "https://github.com/hyperledger/aries-javascript-docs",
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
};

module.exports = config;
