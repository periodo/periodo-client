"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , tags = require('language-tags')
    , { Flex, Box, Link } = require('periodo-ui')
    , { period: { authorityOf }} = require('periodo-utils')
    , work = require('webworkify')
    , { shallowEqualObjects } = require('shallow-equal')

const languageDescription = R.memoize(tag => {
  const language = tags(tag || '').language()

  return language ? language.descriptions()[0] : '(bad value)'
})

function identityWithDefault(defaultLabel) {
  return x => x || defaultLabel
}

const aspects = {
  language: {
    label: 'Language',
    getter: period => languageDescription(period.languageTag),
    render: identityWithDefault('(no value)'),
  },

  spatialCoverage: {
    label: 'Spatial coverage',
    getter: period => period.spatialCoverageDescription || null,
    render: identityWithDefault('(no value)'),
  },

  authority: {
    label: 'Authority',
    getter: period => authorityOf(period).id,
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

class AspectTable extends React.Component {
  constructor() {
    super()

    this.state = {
      counts: [],
    }
  }

  componentDidMount() {
    this.worker = work(require('./worker'))

    this.worker.postMessage({
      type: 'initialize',
      rawDataset: this.props.rawDataset,
    })

    this.worker.addEventListener('message', e => {
      this.setState({
        loading: false,
        counts: e.data,
      })
    })
  }

  componentWillUnmount() {
    this.worker.terminate()
  }

  componentDidUpdate(prevProps) {
    if (this.props.data && (this.props.data !== prevProps.data)) {
      this.setState({ loading: true })
      if (this.worker) {
        setTimeout(() => {
          this.worker.postMessage({
            type: 'get_counts',
            label: this.props.aspect.label,
            periods: this.props.data,
          })
        }, 0)
      }
    }
  }

  render() {
    const { aspect, aspectID, opts, updateOpts } = this.props
        , { counts } = this.state
        , { label } = aspect
        , render = aspect.render || R.identity
        , height = parseInt(opts.height || '256')

    const selected = new Set(R.path([ 'selected', aspectID ], opts) || [])

    return (
      h(Flex, {
        style: {
          flex: 1,
        },
        flexDirection: 'column',
        border: 1,
        borderRadius: '3px',
        borderColor: 'gray.4',
        height,
      }, [
        h(Flex, {
          justifyContent: 'space-between',
          alignItems: 'center',
          bg: 'gray.0',
          p: 2,
          borderRadius: '3px 3px 0 0',
          fontWeight: 'bold',
          fontSize: 2,
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
          },
        }, this.state.loading ? (
          h('div', {
            style: {
              textAlign: 'center',
              padding: '1em',
            },
          }, '. . .')
        ): [
          h(Table, {
            is: 'table',
            px: 1,
            width: '100%',
          }, [
            h('tbody', counts.map(([ value, count, label ]) =>
              h('tr', [
                h('td', count),
                h('td', [
                  h(Link, {
                    href: '',
                    onClick: e => {
                      e.preventDefault();
                      updateOpts(R.pipe(
                        R.over(
                          R.lensPath([ 'selected', aspectID ]),
                          () => [ ...(selected.has(value)
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
            )),
          ]),
        ]),
      ])
    )
  }
}

class Facets extends React.Component {
  shouldComponentUpdate(prevProps) {
    return (
      !shallowEqualObjects(this.props.opts, prevProps.opts) ||
      this.props.data !== prevProps.data
    )
  }

  render() {
    const { opts, data, updateOpts, dataset } = this.props

    const style = {}

    if (opts.flex) {
      style.display = 'flex'
    }

    return (
      h('div', { style }, Object.entries(aspects).map(([ key, aspect ]) =>
        h(AspectTable, {
          key,
          data,
          flex: opts.flex,
          rawDataset: dataset.raw,
          aspect,
          aspectID: key,
          opts,
          updateOpts,
        })
      ))
    )
  }
}


module.exports = {
  label: 'Facets',
  description: 'Filter items based on their attributes',
  makeFilter(opts) {
    const { selected={}} = (opts || {})

    if (R.isEmpty(selected)) return null

    const fns = Object.entries(selected).map(([ aspectID, vals ]) => {
      const { getter } = aspects[aspectID]

      return period => vals.includes(getter(period))
    })

    return period => fns.every(fn => fn(period))
  },
  Component: Facets,
}
