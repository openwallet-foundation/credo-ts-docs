import React from 'react'
import clsx from 'clsx'
import styles from './styles.module.css'

type FeatureItem = {
  title: string
  Svg: React.ComponentType<React.ComponentProps<'svg'>>
  description: JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Use',
    Svg: require('@site/static/img/easy-to-use.svg').default,
    description: (
      <>
        Credo was designed with the mindset that building self-sovereign identity solutions should be easy and
        straightforward.
      </>
    ),
  },
  {
    title: 'Multi-platform',
    Svg: require('@site/static/img/multiplatform.svg').default,
    description: (
      <>
        With support for Node.js and React Native, Credo allows you to reuse the same code base in different
        environments. There is no need to implement the same functionality multiple times.
      </>
    ),
  },
  {
    title: 'Based on the latest standards',
    Svg: require('@site/static/img/standards.svg').default,
    description: <>By keeping up with the latest standards, we ensure Credo is secure and interoperable.</>,
  },
]

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
