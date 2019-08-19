"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , tags = require('language-tags')
    , PromiseWorker = require('promise-worker')
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

function union(...sets) {
  return sets.reduce((acc, s) => new Set([ ...acc, ...s ]), new Set())
}

function intersection(...sets) {
  const all = union(...sets)

  return new Set([ ...all ].filter(x => sets.every(s => s.has(x))))
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
  }

  shouldComponentUpdate(prevProps) {
    return (
      prevProps.counts !== this.props.counts
    )
  }

  render() {
    const { aspect, aspectID, opts, updateOpts, counts } = this.props
        , { label } = aspect
        , render = aspect.render || R.identity
        , height = parseInt(opts.height || '256')

    const selected = new Set(R.path([ 'selected', aspectID ], opts) || [])

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
              px: 1,
              width: '100%',
            }, [
              h('tbody', selectedRows),
            ])
          ),

          selectedRows.length === 0 ? null : (
            h('hr')
          ),

          h(Table, {
            is: 'table',
            px: 1,
            width: '100%',
          }, [
            h('tbody', unselectedRows),
          ]),
        ]),
      ])
    )
  }
}

class Facets extends React.Component {
  constructor() {
    super()

    this.state = {
      countsByAspect: {},
    }
    this.runCalculations = this.runCalculations.bind(this)
  }

  shouldComponentUpdate(prevProps, prevState) {
    return (
      !shallowEqualObjects(this.props.opts, prevProps.opts) ||
      this.state.countsByAspect !== prevState.countsByAspect ||
      this.props.data !== prevProps.data
    )
  }

  componentDidMount() {
    this.props.setBlockState({
      runCalculations: this.runCalculations,
    })
  }

  componentWillUnmount() {
    if (this.workers) {
      this.workers.forEach(w => {
        w.worker.terminate()
      })
    }
  }

  async getWorkers() {
    if (this.workers) return this.workers

    const { dataset } = this.props

    this.workers = Object.keys(aspects).map(() => {
      const worker = work(require('./worker'))

      return {
        worker,
        promiseWorker: new PromiseWorker(worker),
      }
    })

    await Promise.all(this.workers.map(w => w.promiseWorker.postMessage({
      type: 'initialize',
      rawDataset: dataset.raw,
    })))

    return this.workers
  }

  async runCalculations(selected={}, periods) {
    const workers = await this.getWorkers()

    let idsByWorker

    this.setState({ countsByAspect: {}})

    if (R.isEmpty(selected)) {
      idsByWorker = workers.map(() => new Set(periods.map(p => p.id)))
    }

    if (!idsByWorker) {
      const matchers = Object.keys(aspects).map((key, i) =>
        workers[i].promiseWorker.postMessage({
          type: 'get_matching',
          aspect: key,
          selected: new Set(selected[key] || []),
          periods,
        }))

      idsByWorker = (await Promise.all(matchers)).map(resp => resp.ids)
    }

    const matchingIDs = intersection(...idsByWorker)

    Object.keys(aspects).map((key, i) => {
      const matchingIDsForAspect = intersection(...idsByWorker.filter((_, j) => i !== j))
          , remainingPeriods = periods.filter(period => matchingIDsForAspect.has(period.id))

      workers[i].promiseWorker.postMessage({
        type: 'get_counts',
        aspect: key,
        periods: remainingPeriods,
      }).then(({ countArr }) => {
        this.setState(R.set(
          R.lensPath([ 'countsByAspect', key ]),
          countArr,
        ))
      })
    })

    return new Set(matchingIDs)
  }

  render() {
    const { opts, data, updateOpts, dataset } = this.props
        , { countsByAspect } = this.state

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
          counts: countsByAspect[key],
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
  async makeFilter(opts, state, periods) {
    const { selected={}} = (opts || {})
        , { runCalculations } = state

    const matchingIDs = await runCalculations(selected, periods)

    return period => matchingIDs.has(period.id)
  },
  Component: Facets,
}
