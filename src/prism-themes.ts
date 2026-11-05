import type { PrismTheme } from 'prism-react-renderer'

// Brand code themes: pink keywords, violet functions, mint strings. Every
// token passes WCAG AA against its background.
const theme = (colors: {
  background: string
  plain: string
  comment: string
  keyword: string
  func: string
  type: string
  string: string
  number: string
  property: string
  punctuation: string
  inserted: string
  deleted: string
}): PrismTheme => ({
  plain: { color: colors.plain, backgroundColor: colors.background },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: colors.comment, fontStyle: 'italic' } },
    { types: ['keyword', 'selector', 'important', 'atrule', 'rule'], style: { color: colors.keyword } },
    { types: ['operator'], style: { color: colors.punctuation } },
    { types: ['function', 'function-variable'], style: { color: colors.func } },
    { types: ['class-name', 'maybe-class-name', 'builtin', 'namespace'], style: { color: colors.type } },
    { types: ['string', 'char', 'attr-value', 'regex', 'url', 'template-string'], style: { color: colors.string } },
    { types: ['number', 'boolean', 'constant', 'symbol'], style: { color: colors.number } },
    { types: ['property', 'attr-name', 'tag'], style: { color: colors.property } },
    { types: ['punctuation'], style: { color: colors.punctuation } },
    { types: ['inserted'], style: { color: colors.inserted } },
    { types: ['deleted'], style: { color: colors.deleted } },
    { types: ['italic'], style: { fontStyle: 'italic' } },
    { types: ['bold'], style: { fontWeight: 'bold' } },
  ],
})

export const credoLight = theme({
  background: '#f8f6fc',
  plain: '#1f1d23',
  comment: '#6b6872',
  keyword: '#b40062',
  func: '#6a24d0',
  type: '#8a1ab8',
  string: '#0b7a55',
  number: '#a14a00',
  property: '#1f5fbf',
  punctuation: '#55525b',
  inserted: '#0b7a55',
  deleted: '#c0003c',
})

export const credoDark = theme({
  background: '#141219',
  plain: '#ece9f2',
  comment: '#8a8790',
  keyword: '#ff6bb8',
  func: '#c5b4ff',
  type: '#e39bff',
  string: '#7ee2b8',
  number: '#ffb86b',
  property: '#8cc8ff',
  punctuation: '#a2a0a8',
  inserted: '#7ee2b8',
  deleted: '#ff7a9a',
})
