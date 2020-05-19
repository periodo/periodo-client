"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , tags = require('language-tags')
    , { Label, HelpText } = require('periodo-ui')
    , { period: { authorityOf }} = require('periodo-utils')
    , { shallowEqualObjects } = require('shallow-equal')
    , AspectTable = require('./AspectTable')
    , FacetCalculator = require('./FacetCalculator')

const languageDescription = R.memoize(tag => {
  const language = tags(tag || '').language()

  return language ? language.descriptions()[0] : '(bad value)'
})

function identityWithDefault(defaultLabel) {
  return x => x || defaultLabel
}

const aspects = {
  authority: {
    label: 'Authority',
    flexBasis: 'calc(50% + .66em)',
    getter: period => authorityOf(period).id,
    render: identityWithDefault('(no value)'),
  },

  language: {
    label: 'Language',
    flexBasis: '25%',
    getter: period => languageDescription(period.languageTag),
    render: identityWithDefault('(no value)'),
  },

  spatialCoverage: {
    label: 'Spatial coverage',
    flexBasis: '25%',
    getter: period => period.spatialCoverageDescription || null,
    render: identityWithDefault('(no value)'),
  },
}

class Facets extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      countsByAspect: {},
    }
    this.resetAspectCounts = this.resetAspectCounts.bind(this)
    this.setAspectCount = this.setAspectCount.bind(this)
    this.facetCalculator = new FacetCalculator(
      this.props.dataset,
      Object.keys(aspects),
      this.resetAspectCounts,
      this.setAspectCount
    )
    this._isMounted = false
  }

  shouldComponentUpdate(prevProps, prevState) {
    return (
      !shallowEqualObjects(this.props.opts, prevProps.opts) ||
      this.state.countsByAspect !== prevState.countsByAspect ||
      this.props.data !== prevProps.data
    )
  }

  componentDidMount() {
    this._isMounted = true
    this.props.setBlockState({ facetCalculator: this.facetCalculator })
    this.props.updateOpts(this.props.opts, true) // invalidate data on re-mount
  }

  componentWillUnmount() {
    this._isMounted = false
    this.facetCalculator.shutdown()
  }

  resetAspectCounts() {
    if (this._isMounted) {
      this.setState({ countsByAspect: {}})
    }
  }

  setAspectCount(aspect, count) {
    if (this._isMounted) {
      this.setState(({ countsByAspect: prevCountsByAspect }) => ({
        countsByAspect: {
          ...prevCountsByAspect,
          [aspect]: count,
        },
      }))
    }
  }

  render() {
    if (this.props.hidden) {
      return null
    }

    const { opts, data, updateOpts, dataset } = this.props
        , { countsByAspect } = this.state

    const hiddenAspects = new Set(
      opts.hiddenAspects ? opts.hiddenAspects.split(',') : []
    )

    const aspectsShown = Object.entries(aspects)
      .filter(([ k ]) => ! hiddenAspects.has(k))

    const aspectsDescription = aspectsShown
      .map(([ , v ]) => v.label.toLowerCase())
      .join(', ')
      .replace(/,([^,]*)$/, ' or$1')

    const aspectProportions = opts.aspectProportions
      ? opts.aspectProportions.split(',')
      : []

    return (h('div'), [
      h(Label, { key: 'label' },
        `By ${aspectsDescription}`),

      h(HelpText, { key: 'help' },
        `Show periods having the selected ${aspectsDescription}`),

      h('div', {
        style: { display: 'flex' },
        key: 'aspect-table',
      }, aspectsShown.map(([ key, aspect ], i) =>
        h(AspectTable, {
          key,
          data,
          rawDataset: dataset.raw,
          aspect: {
            ...aspect,
            flexBasis: aspectProportions[i] || aspect.flexBasis,
          },
          aspectID: key,
          counts: countsByAspect[key],
          opts,
          updateOpts,
        })
      )),
    ])
  }
}


module.exports = {
  label: 'Facets',
  description: 'Filter items based on their attributes',
  async makeFilter(opts, state, periods) {
    if (! periods) return null

    const { selected={}} = (opts || {})
        , { facetCalculator } = state

    const matchingIDs = await facetCalculator.runCalculations(selected, periods)
    return period => matchingIDs.has(period.id)
  },
  Component: Facets,
  keepMounted: true,
}
