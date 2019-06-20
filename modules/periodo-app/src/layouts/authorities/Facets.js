"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , tags = require('language-tags')
    , { Flex, Box, Link } = require('periodo-ui')
    , work = require('webworkify')

const languageDescription = R.memoize(tag => {
  const language = tags(tag || '').language()

  return language ? language.descriptions()[0] : '(bad value)'
})

const aspects = {
  language: {
    label: 'Language',
    getter: period => languageDescription(period.languageTag),
    render: R.identity,
  },

  spatialCoverage: {
    label: 'Spatial coverage',
    getter: period => period.spatialCoverageDescription,
    render: R.identity,
  }
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
  }
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
    this.worker = work(require('./facet_worker'))

    this.worker.addEventListener('message', e => {
      this.setState({
        counts: e.data,
      })
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.data && (this.props.data !== prevProps.data)) {
      if (this.worker) {
        this.worker.postMessage({
          type: this.props.aspect.label,
          data: this.props.data,
        })
      }
    }
  }

  render() {
    const { aspect, aspectID, opts, updateOpts } = this.props
        , { counts } = this.state
        , { label } = aspect
        , render = aspect.render || R.identity

    const selected = new Set(R.path(['selected', aspectID], opts) || [])

    return (
      h(Flex, {
        flexDirection: 'column',
        border: 1,
        borderRadius: '3px',
        borderColor: 'gray.4',
        height: 256,
      }, [
        h(Box, {
          bg: 'gray.0',
          p: 2,
          borderRadius: '3px 3px 0 0',
          fontWeight: 'bold',
          fontSize: 2,
        }, label),

        h('div', {
          style: {
            height:'100%',
            overflowY: 'scroll',
          }
        }, [
          h(Table, {
            is: 'table',
            px: 1,
            width: '100%',
          }, [
            h('tbody', counts.map(([value, count]) =>
              h('tr', [
                h('td', count),
                h('td', [
                  h(Link, {
                    href: '',
                    onClick: e => {
                      e.preventDefault();
                      updateOpts(R.pipe(
                        R.over(
                          R.lensPath(['selected', aspectID]),
                          () => [...(selected.has(value)
                            ? withoutValue(value, selected)
                            : withValue(value, selected))]),
                        R.ifElse(
                          val => val.selected[aspectID].length,
                          R.identity,
                          R.dissocPath(['selected', aspectID])),
                        R.ifElse(
                          val => R.isEmpty(val.selected),
                          R.dissoc('selected'),
                          R.identity)
                      ), true)

                    },
                  }, render(value))
                ]),
              ])
            ))
          ])
        ])
      ])
    )
  }
}

class Facets extends React.Component {
  render() {
    const { opts, data, updateOpts } = this.props

    return (
      h('div', Object.entries(aspects).map(([key, aspect]) =>
        h(AspectTable, {
          key,
          data,
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
    const { selected={} } = (opts || {})

    if (R.isEmpty(selected)) return null

    const fns = Object.entries(selected).map(([aspectID, vals]) => {
      const { getter } = aspects[aspectID]

      return period => vals.includes(getter(period))
    })

    return period => fns.every(fn => fn(period))
  },
  Component: Facets,
}
