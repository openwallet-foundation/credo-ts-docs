// Generated from the docs information architecture. Keep doc ids in sync with versioned_sidebars.

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    'index',
    {
      type: 'category',
      label: 'Getting started',
      link: {
        type: 'doc',
        id: 'getting-started/index',
      },
      items: [
        'getting-started/installation',
        'getting-started/first-agent',
        'getting-started/example-setups',
        'getting-started/ai-agents',
      ],
    },
    {
      type: 'category',
      label: 'Concepts',
      link: {
        type: 'doc',
        id: 'concepts/index',
      },
      items: [
        'concepts/verifiable-credentials',
        'concepts/agents',
        'concepts/did-and-didcomm',
        'concepts/platform-and-environment',
      ],
    },
    {
      type: 'category',
      label: 'Agent setup',
      link: {
        type: 'doc',
        id: 'agent-setup/index',
      },
      items: [
        {
          type: 'category',
          label: 'Storage',
          link: {
            type: 'doc',
            id: 'agent-setup/storage/index',
          },
          items: ['agent-setup/storage/askar', 'agent-setup/storage/drizzle'],
        },
        'agent-setup/key-management',
        'agent-setup/caching',
        'agent-setup/multi-tenancy',
        'agent-setup/logging',
      ],
    },
    {
      type: 'category',
      label: 'Protocols',
      link: {
        type: 'doc',
        id: 'protocols/index',
      },
      items: [
        {
          type: 'category',
          label: 'OpenID4VC',
          link: {
            type: 'doc',
            id: 'protocols/openid4vc/index',
          },
          items: [
            'protocols/openid4vc/issuer',
            'protocols/openid4vc/holder',
            'protocols/openid4vc/verifier',
            'protocols/openid4vc/authorization',
            'protocols/openid4vc/dc-api',
            'protocols/openid4vc/sd-jwt-vc',
            'protocols/openid4vc/mdoc',
            'protocols/openid4vc/w3c',
          ],
        },
        {
          type: 'category',
          label: 'ISO mdoc',
          link: {
            type: 'doc',
            id: 'protocols/mdoc/index',
          },
          items: ['protocols/mdoc/proximity', 'protocols/mdoc/dc-api'],
        },
        {
          type: 'category',
          label: 'DIDComm',
          link: {
            type: 'doc',
            id: 'protocols/didcomm/index',
          },
          items: [
            'protocols/didcomm/connections',
            'protocols/didcomm/issue-credential',
            'protocols/didcomm/present-proof',
            'protocols/didcomm/mediation',
            'protocols/didcomm/messaging',
            'protocols/didcomm/anoncreds',
            'protocols/didcomm/w3c',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Credential formats',
      link: {
        type: 'doc',
        id: 'credential-formats/index',
      },
      items: [
        'credential-formats/sd-jwt-vc',
        'credential-formats/mdoc',
        'credential-formats/w3c-vc',
        'credential-formats/anoncreds',
        'credential-formats/status-lists',
      ],
    },
    {
      type: 'category',
      label: 'DIDs and trust',
      link: {
        type: 'doc',
        id: 'dids-and-trust/index',
      },
      items: [
        'dids-and-trust/x509',
        'dids-and-trust/trust',
        'dids-and-trust/cheqd',
        'dids-and-trust/indy-vdr',
        'dids-and-trust/hedera',
        'dids-and-trust/webvh',
      ],
    },
    'supported-standards',
    {
      type: 'category',
      label: 'Updating',
      link: {
        type: 'doc',
        id: 'updating/index',
      },
      items: [
        'updating/versions/0.7-to-0.8',
        'updating/versions/0.6-to-0.7',
        'updating/versions/0.5-to-0.6',
        'updating/versions/0.4-to-0.5',
        'updating/versions/0.3-to-0.4',
        'updating/versions/0.2-to-0.3',
        'updating/versions/0.1-to-0.2',
        'updating/update-assistant',
        'updating/update-indy-sdk-to-askar',
      ],
    },
    'ecosystem/index',
    {
      type: 'category',
      label: 'Extensions',
      link: {
        type: 'doc',
        id: 'extensions/index',
      },
      items: ['extensions/rest', 'extensions/react-hooks', 'extensions/redux-store', 'extensions/push-notifications'],
    },
  ],
}

module.exports = sidebars
