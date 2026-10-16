// Projects that run on Credo, shown on the homepage. To add yours, open a pull
// request with an entry and a logo in `static/img/users/` (SVG preferred, with a
// `dark` variant if the logo doesn't work on a dark background).

export interface CredoUser {
  name: string
  by?: string
  url: string
  /** Defaults to the host name of `url` */
  linkLabel?: string
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
      'A platform for issuing and verifying digital credentials with OpenID4VC, SD-JWT VC, mdoc and DIDComm. Its agents run on Credo, with each customer as a separate tenant.',
    tags: ['Issuer', 'Verifier', 'Multi-tenancy'],
  },
  {
    name: 'Paradym Wallet',
    by: 'Animo',
    url: 'https://github.com/animo/paradym-wallet',
    linkLabel: 'github.com/animo/paradym-wallet',
    logo: { light: '/img/users/paradym-wallet.png', height: 44 },
    description:
      'An open source wallet app for iOS and Android, built with Credo on React Native. It receives and presents credentials over OpenID4VC and DIDComm, and is a starting point for building your own wallet.',
    tags: ['Wallet', 'React Native', 'Open source'],
  },
  {
    name: '2060',
    url: 'https://2060.io',
    logo: { light: '/img/users/2060.svg', dark: '/img/users/2060-dark.svg', height: 30 },
    description:
      'Builds Hologram, a messaging app and AI agent framework where people, services and agents identify each other with verifiable credentials. The Hologram app and VS Agent, the service agent of the Verana trust network, are built on Credo.',
    tags: ['Messaging', 'AI agents', 'Verana'],
  },
]
