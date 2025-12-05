import AdmonitionTypeCaution from '@theme/Admonition/Type/Caution'
import AdmonitionTypeDanger from '@theme/Admonition/Type/Danger'
import AdmonitionTypeInfo from '@theme/Admonition/Type/Info'
import AdmonitionTypeNote, { Props as AdmonitionTypeNoteProps } from '@theme/Admonition/Type/Note'
import AdmonitionTypeTip from '@theme/Admonition/Type/Tip'
import AdmonitionTypeWarning from '@theme/Admonition/Type/Warning'
import type AdmonitionTypes from '@theme/Admonition/Types'
import React from 'react'

const admonitionTypes: typeof AdmonitionTypes = {
  note: AdmonitionTypeNote,
  tip: AdmonitionTypeTip,
  info: AdmonitionTypeInfo,
  warning: AdmonitionTypeWarning,
  danger: AdmonitionTypeDanger,
  // @ts-expect-error
  issuer: (props: AdmonitionTypeNoteProps) => <AdmonitionTypeNote {...props} title="issuer" icon="📄" />,
  // @ts-expect-error
  holder: (props: AdmonitionTypeNoteProps) => <AdmonitionTypeNote {...props} title="holder" icon="🗄" />,
  // @ts-expect-error
  verifier: (props: AdmonitionTypeNoteProps) => <AdmonitionTypeNote {...props} title="verifier" icon="👮" />,
  // @ts-expect-error
  bob: (props: AdmonitionTypeNoteProps) => <AdmonitionTypeNote {...props} title="bob" icon="🧔" />,
  // @ts-expect-error
  acme: (props: AdmonitionTypeNoteProps) => <AdmonitionTypeNote {...props} title="acme" icon="🏢" />,
}

const admonitionAliases: typeof AdmonitionTypes = {
  caution: AdmonitionTypeCaution,
}

export default {
  ...admonitionTypes,
  ...admonitionAliases,
}
