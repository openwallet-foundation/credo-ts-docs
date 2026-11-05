import AdmonitionTypeCaution from '@theme/Admonition/Type/Caution'
import AdmonitionTypeDanger from '@theme/Admonition/Type/Danger'
import AdmonitionTypeInfo from '@theme/Admonition/Type/Info'
import AdmonitionTypeNote, { type Props as AdmonitionTypeNoteProps } from '@theme/Admonition/Type/Note'
import AdmonitionTypeTip from '@theme/Admonition/Type/Tip'
import AdmonitionTypeWarning from '@theme/Admonition/Type/Warning'
import type AdmonitionTypes from '@theme/Admonition/Types'
import type { ReactNode } from 'react'

// Role admonitions (`:::issuer`, `:::holder`, `:::verifier`) mark which party runs a code block.
const RoleIcon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const IssuerIcon = () => (
  <RoleIcon>
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <path d="m9 12 2 2 4-4" />
  </RoleIcon>
)

const HolderIcon = () => (
  <RoleIcon>
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </RoleIcon>
)

const VerifierIcon = () => (
  <RoleIcon>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="m8 12 3 3 5-6" />
  </RoleIcon>
)

const role = (title: string, Icon: () => ReactNode) => (props: AdmonitionTypeNoteProps) => (
  <AdmonitionTypeNote {...props} title={props.title ?? title} icon={<Icon />} />
)

const admonitionTypes = {
  note: AdmonitionTypeNote,
  tip: AdmonitionTypeTip,
  info: AdmonitionTypeInfo,
  warning: AdmonitionTypeWarning,
  danger: AdmonitionTypeDanger,
  caution: AdmonitionTypeCaution,
  issuer: role('Issuer', IssuerIcon),
  holder: role('Holder', HolderIcon),
  verifier: role('Verifier', VerifierIcon),
} as typeof AdmonitionTypes

export default admonitionTypes
