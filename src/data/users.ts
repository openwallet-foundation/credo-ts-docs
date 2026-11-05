// Projects that run on Credo, shown on the homepage. To add yours, open a pull
// request with an entry and a logo in `static/img/users/` (SVG preferred, with a
// `dark` variant if the logo doesn't work on a dark background).

export interface CredoUser {
  name: string
  by?: string
  url: string
  /** Defaults to the host name of `url` */
  linkLabel?: string
  /** More links, shown next to the main one */
  links?: { label: string; url: string }[]
  logo: { light: string; dark?: string; height?: number }
  description: string
  tags: string[]
}

export const credoUsers: CredoUser[] = [
  {
    name: 'Paradym',
    by: 'Animo',
    url: 'https://paradym.id',
    logo: { light: '/img/users/paradym.svg', height: 30 },
    description:
      'A platform for issuing and verifying credentials in EUDI and other ecosystems. It can issue and verify credentials from national EUDI wallets such as France Identité and the German d‑you. Each customer is a separate Credo tenant.',
    tags: ['Issuer', 'Verifier', 'EUDI'],
  },
  {
    name: 'Paradym Wallet',
    by: 'Animo',
    url: 'https://github.com/animo/paradym-wallet',
    linkLabel: 'Paradym Wallet on GitHub',
    logo: { light: '/img/users/paradym-wallet.png', height: 44 },
    description:
      'An open source wallet app for iOS and Android, built with Credo on React Native. It supports the EUDI flows, such as receiving a PID and presenting it with OpenID4VP, as well as DIDComm, and is a starting point for building your own wallet.',
    tags: ['Wallet', 'EUDI', 'Open source'],
  },
  {
    name: '2060',
    url: 'https://2060.io',
    logo: { light: '/img/users/2060.svg', dark: '/img/users/2060-dark.svg', height: 30 },
    description:
      'Builds Hologram, a messaging app and AI agent framework where people, services and agents identify each other with verifiable credentials. The Hologram app and VS Agent, the service agent of the Verana trust network, are built on Credo.',
    tags: ['Messaging', 'AI agents', 'Verana'],
  },
  {
    name: 'Digital Catapult',
    url: 'https://www.digicatapult.org.uk',
    links: [{ label: 'Veritable on GitHub', url: 'https://github.com/digicatapult/veritable-cloudagent' }],
    logo: { light: '/img/users/digital-catapult.png', dark: '/img/users/digital-catapult-dark.png', height: 40 },
    description:
      'A UK deep tech innovation organisation. Its open source Veritable framework provides a RESTful interface for supply chain use cases exploring verifiable credentials. The Veritable cloud agent runs on Credo, supporting DIDComm, W3C credentials and AnonCreds.',
    tags: ['Supply chain', 'Open source'],
  },
]
