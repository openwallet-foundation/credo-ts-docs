import React, { isValidElement } from 'react'
import useIsBrowser from '@docusaurus/useIsBrowser'
import useDocusaurusContext from '@docusaurus/useGlobalData'
import ElementContent from '@theme/CodeBlock/Content/Element'
import StringContent from '@theme/CodeBlock/Content/String'
import { useDocsVersion } from '@docusaurus/theme-common/internal'
/**
 * Best attempt to make the children a plain string so it is copyable. If there
 * are react elements, we will not be able to copy the content, and it will
 * return `children` as-is; otherwise, it concatenates the string children
 * together.
 */

function maybeStringifyChildren(children) {
  if (React.Children.toArray(children).some((el) => isValidElement(el))) {
    return children
  } // The children is now guaranteed to be one/more plain strings

  return Array.isArray(children) ? children.join('') : children
}

const parseSectionNumber = (metaString) => {
  return metaString
    .split(' ')
    .find((x) => x.match(/^section-/))
    ?.substr(8)
}

const getSectionContent = (sectionNumber, contentBody) => {
  const startToken = `start-section-${sectionNumber}`
  const endToken = `end-section-${sectionNumber}`

  const contentArray = contentBody.split('\n')

  const startIndex = contentArray.indexOf(contentArray.find((x) => x.includes(startToken)))
  const endIndex = contentArray.indexOf(contentArray.find((x) => x.includes(endToken)))

  const sectionContent = contentArray.slice(startIndex + 1, endIndex)

  return sectionContent.join('\r\n')
}

const parseFileName = (metaString) => {
  return metaString.split(' ').find((x) => x.match(/.(js|ts)$/))
}

const removeSectionMarkers = (sectionContent) => {
  const sectionContentArr = sectionContent.split('\n')
  const withoutMarkers = sectionContentArr.filter((x) => !x.match(/section-/))
  return withoutMarkers.join('\r\n')
}

export default function CodeBlock({ children: rawChildren, ...props }) {
  // The Prism theme on SSR is always the default theme but the site theme can
  // be in a different mode. React hydration doesn't update DOM styles that come
  // from SSR. Hence force a re-render after mounting to apply the current
  // relevant styles.
  const isBrowser = useIsBrowser()
  const versionMetadata = useDocsVersion()
  const children = maybeStringifyChildren(rawChildren)

  const version = versionMetadata.version

  const CodeBlockComp = typeof children === 'string' ? StringContent : ElementContent

  if (!props.metastring) {
    return (
      <CodeBlockComp key={String(isBrowser)} {...props}>
        {children}
      </CodeBlockComp>
    )
  }

  let snippetContent

  try {
    snippetContent = require(`!!raw-loader!../../../snippets/${version}/src/${parseFileName(props.metastring)}`).default
  } catch {}

  const sectionNumber = parseSectionNumber(props.metastring)

  let sectionContent

  if (snippetContent) {
    sectionContent = sectionNumber
      ? getSectionContent(sectionNumber, snippetContent)
      : removeSectionMarkers(snippetContent)
  }
  return (
    <CodeBlockComp key={String(isBrowser)} {...props}>
      {sectionContent ? sectionContent : children}
    </CodeBlockComp>
  )
}
