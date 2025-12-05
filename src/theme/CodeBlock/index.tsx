import { useDocsVersion } from '@docusaurus/plugin-content-docs/client'
import type { Props as CodeBlockProps } from '@theme/CodeBlock'

import CodeBlock from '@theme-original/CodeBlock'
import React, { type ReactNode, useEffect, useState } from 'react'

const parseFileName = (metaString: string): string | undefined => {
  return metaString.split(' ').find((x: string) => x.match(/.(js|ts)$/))
}

const parseSectionNumber = (metaString: string): number | undefined => {
  const sectionNumber = metaString
    .split(' ')
    .find((x) => x.match(/^section-/))
    ?.slice(8)

  return sectionNumber !== undefined ? Number(sectionNumber) : undefined
}

const getSectionContent = (sectionNumber: number, contentBody: string) => {
  const startToken = `start-section-${sectionNumber}`
  const endToken = `end-section-${sectionNumber}`

  const contentArray = contentBody.split('\n')

  const startIndex = contentArray.indexOf(contentArray.find((x) => x.includes(startToken)))
  const endIndex = contentArray.indexOf(contentArray.find((x) => x.includes(endToken)))

  const sectionContent = contentArray.slice(startIndex + 1, endIndex)

  return sectionContent.join('\r\n')
}

const removeSectionMarkers = (sectionContent: string) => {
  const sectionContentArr = sectionContent.split('\n')
  const withoutMarkers = sectionContentArr.filter((x) => !x.match(/section-/))
  return withoutMarkers.join('\r\n')
}

export default function CodeBlockWrapper(props: CodeBlockProps): ReactNode {
  const versionMetadata = useDocsVersion()
  const version = versionMetadata.version
  const [snippetContent, setSnippetContent] = useState(props.children)

  useEffect(() => {
    if (!props.metastring) return

    const fileName = parseFileName(props.metastring)
    if (!fileName) return

    const sectionNumber = parseSectionNumber(props.metastring)

    const loadContent = import(`!!raw-loader!../../../snippets/${version}/src/${fileName}`)
    loadContent.then((content) => {
      const sectionContent = sectionNumber
        ? getSectionContent(sectionNumber, content.default)
        : removeSectionMarkers(content.default)

      setSnippetContent(sectionContent)
    })
  }, [props.metastring, version])

  return <CodeBlock {...props}>{snippetContent}</CodeBlock>
}
