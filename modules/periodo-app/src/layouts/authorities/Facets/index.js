"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , tags = require('language-tags')
    , { Flex, Box, Link, Label, HelpText } = require('periodo-ui')
    , { period: { authorityOf }} = require('periodo-utils')
    , { shallowEqualObjects } = require('shallow-equal')
    , styled = require('styled-components').default
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

const Table = Box.extend([], {
  overflowY: 'scroll',
  '& td': {
    padding: '2px 5px',
  },
  '& td:first-of-type': {
    color: '#999',
  },
  '& td:last-of-type': {
    width: '100%',
  },
})

function withoutValue(val, set) {
  const newSet = new Set(set)
  newSet.delete(val)
  return newSet;
}

function withValue(val, set) {
  const newSet = new Set(set)
  newSet.add(val)
  return newSet;
}

const AspectContainer = styled(Flex)`
&:not(:last-of-type) {
  margin-right: 16px;
}
`

class AspectTable extends React.Component {
  constructor() {
    super()
  }

  shouldComponentUpdate(prevProps) {
    return (
      prevProps.counts !== this.props.counts
    )
  }

  render() {
    const { aspect, aspectID, opts, updateOpts, counts, hidden } = this.props
        , { label, flexBasis } = aspect
        , render = aspect.render || R.identity
        , height = parseInt(opts.height || '256')
        , selected = new Set(R.path([ 'selected', aspectID ], opts) || [])

    if (hidden.has(aspectID)) {
      return null
    }

    const selectedRows = []
        , unselectedRows = []

    if (counts) {
      counts.forEach(([ value, count, label ]) => {
        const isSelected = selected.has(value)

        const el = (
          h('tr', [
            h('td', count),
            h('td', [
              h(Link, {
                href: '',
                color: `blue.${ isSelected ? 8 : 4 }`,
                onClick: e => {
                  e.preventDefault();
                  updateOpts(R.pipe(
                    R.over(
                      R.lensPath([ 'selected', aspectID ]),
                      () => [ ...(isSelected
                        ? withoutValue(value, selected)
                        : withValue(value, selected)) ]),
                    R.ifElse(
                      val => val.selected[aspectID].length,
                      R.identity,
                      R.dissocPath([ 'selected', aspectID ])),
                    R.ifElse(
                      val => R.isEmpty(val.selected),
                      R.dissoc('selected'),
                      R.identity)
                  ), true)

                },
              }, render(label === undefined ? value : label)),
            ]),
          ])
        )

        if (isSelected) {
          selectedRows.push(el)
        } else {
          unselectedRows.push(el)
        }
      })
    }

    return (
      h(AspectContainer, {
        style: {
          flex: 1,
          flexBasis,
        },
        flexDirection: 'column',
        height,
      }, [
        h(Flex, {
          justifyContent: 'space-between',
          alignItems: 'center',
          bg: 'gray.1',
          p: 2,
          fontWeight: 'bold',
          fontSize: 1,
        }, [
          h('span', label),

          h('span', {}, selected.size === 0 ? null : (
            h('a', {
              href: '',
              style: {
                color: 'red',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 100,
              },
              onClick: e => {
                e.preventDefault();
                updateOpts(R.dissocPath([ 'selected', aspectID ]), true)
              },
            }, 'Clear')
          )),
        ]),

        h('div', {
          style: {
            height:'100%',
            overflowY: 'scroll',
            overscrollBehaviorY: 'contain',
          },
        }, counts == null ? (
          h('div', {
            style: {
              textAlign: 'center',
              padding: '1em',
            },
          }, '. . .')
        ): [
          selectedRows.length === 0 ? null : (
            h(Table, {
              is: 'table',
              className: 'selected',
              px: 1,
              py: 1,
              width: '100%',
            }, [
              h('tbody', selectedRows),
            ])
          ),

          unselectedRows.length === 0 ? null : (
            h(Table, {
              is: 'table',
              px: 1,
              width: '100%',
              bg: 'gray.1',
            }, [
              h('tbody', unselectedRows),
            ])
          ),
        ]),
      ])
    )
  }
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

    const style = {}

    if (opts.flex) {
      style.display = 'flex'
    }

    const hidden = new Set(opts.hidden|| [])

    if (hidden.size === Object.keys(aspects).length) {
      return null
    }

    const aspectsShown = Object.entries(aspects)
      .filter(([ k ]) => ! hidden.has(k))
      .map(([ , v ]) => v.label.toLowerCase())
      .join(', ')
      .replace(/,([^,]*)$/, ' or$1')

    return (h('div'), [
      h(Label, { key: 'label' },
        `By ${aspectsShown}`),

      h(HelpText, { key: 'help' },
        `Show periods having the selected ${aspectsShown}`),

      h('div', {
        style,
        key: 'aspect-table',
      }, Object.entries(aspects).map(([ key, aspect ]) =>
        h(AspectTable, {
          key,
          data,
          flex: opts.flex,
          rawDataset: dataset.raw,
          aspect,
          aspectID: key,
          counts: countsByAspect[key],
          hidden,
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
