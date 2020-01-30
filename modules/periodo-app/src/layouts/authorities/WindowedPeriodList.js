"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , natsort = require('natsort')
    , { FixedSizeList: List } = require('react-window')
    , { authorityOf } = require('periodo-utils/src/period')
    , { yearPublished } = require('periodo-utils/src/source')
    , styled = require('styled-components').default
    , { Link, Text } = require('periodo-ui')
    , { Route } = require('org-shell')
    , { getLayoutOpts, getLayoutParams } = require('periodo-utils')

const columns = {
  label: {
    label: 'Label',
    sort: (periods, { dataset, sortDirection }) => {
      return dataset.cachedSort(periods, 'label', sortDirection === "desc")
    },
    getValue(period) {
      return period.label
    },
  },

  start: {
    label: 'Start',

    sort: (periods, { dataset, sortDirection }) => {
      return dataset.cachedSort(periods, 'start', sortDirection === "desc")
    },

    getValue(period) {
      return period.start.label
    },

  },

  stop: {
    label: 'Stop',

    sort: (periods, { dataset, sortDirection }) => {
      return dataset.cachedSort(periods, 'stop', sortDirection === "desc")
    },

    getValue(period) {
      return period.stop.label
    },
  },

  spatialCoverage: {
    label: 'Spatial coverage',
    getValue(period) {
      return period.spatialCoverageDescription
    },
  },

  publicationDate: {
    label: 'Pub. date',
    getValue(period) {
      return yearPublished(authorityOf(period).source)
    },
  },
}

const ListWrapper = styled.div`
.row {
  display: flex;
  align-items: center;
}

.row span {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  padding: 0 7px;
}

.row :nth-child(1) {
  min-width: 6ch;
  max-width: 6ch;
}

.row :nth-child(2) {
  min-width: 10ch;
  max-width: 10ch;
}

.row :nth-child(3) {
  flex: 1;
  min-width: 20ch;
}

.row :nth-child(4) {
  min-width: 10ch;
  width: 20ch;
}

.row :nth-child(5) {
  min-width: 10ch;
  width: 20ch;
}

.row :nth-child(6) {
  min-width: 10ch;
  width: 30ch;
}

.row :nth-child(7) {
  min-width: 12ch;
  width: 12ch;
}

.row__header {
  font-weight: bold;
  margin-bottom: 1px;

  z-index: 1;
}

.row[data-selected="true"] {
  background-color: #f0f0f0;
  border-top: 1px solid #999;
  border-bottom: 1px solid #999;
}

.row__header span {
  z-index: 1;
  cursor: pointer;
  padding: 8px 7px;
}

`

/*
display: grid;
grid-template-columns: 5ch 100px 100px 1fr 1fr;
*/

function ItemRow({
  index,
  style,
  data: {
    backend,
    periods,
    hoveredPeriod,
    selectedPeriod,
    setHoveredPeriod,
    setSelectedPeriod,
    layoutOpts,
    layoutParams,
    showEditLink,
  },
}) {
  const period = periods[index]

  return (
    h('div', {
      className: 'row',
      style: {
        ...style,
        backgroundColor: (
          hoveredPeriod === period ||
          selectedPeriod === period
        )? '#f0f0f0' : 'unset',
      },
      ['data-selected']: selectedPeriod === period,
      onMouseDown: () => {
        setSelectedPeriod(period)
      },
      onMouseEnter: () => {
        setHoveredPeriod(period)
      },
      onMouseLeave: () => {
        setHoveredPeriod(null)
      },
    }, [
      h('span', [
        h(Text, {
          color: 'gray.6',
        }, index + 1),
      ]),
      h('span', [
        h(Link, {
          route: new Route('period-view', {
            backendID: backend.asIdentifier(),
            authorityID: authorityOf(period).id,
            periodID: period.id,
          }),
        }, 'view'),
        showEditLink
          ? h(Link, {
            ml: 2,
            route: new Route('period-edit', {
              backendID: backend.asIdentifier(),
              authorityID: authorityOf(period).id,
              periodID: period.id,
              nextPage: layoutParams.page,
            }, layoutOpts),
          }, 'edit')
          : null,
      ]),
    ].concat(Object.values(columns).map(({ getValue }) =>
      h('span', getValue(period))
    )))
  )
}

function itemKey(index, data) {
  return data.periods[index].id
}

class PeriodList extends React.Component {
  constructor() {
    super()

    this.state = {
      rect: null,
      sortedData: null,
    }

    this.onKeyDown = this.onKeyDown.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.handleScroll = this.handleScroll.bind(this)

    this.listRef = React.createRef()
  }

  componentDidMount() {
    this.setState({
      rect: this.el.getBoundingClientRect(),
      headerWidth: this.el.clientWidth,
    })
  }

  componentDidUpdate(prevProps) {
    const updateSort = (
      prevProps.sortBy !== this.props.sortBy ||
      prevProps.sortDirection !== this.props.sortDirection ||
      prevProps.data !== this.props.data
    )

    if (updateSort) {
      this.listRef.current.scrollToItem(0)
      this.props.setSelectedPeriod(null)
      this.updateSort()
    }
  }

  onMouseMove(e) {
    this.mouseOffset = e.y - this.scrollEl.getBoundingClientRect().y - 34
  }

  onKeyDown(e) {
    const { selectedPeriod, setHoveredPeriod, setSelectedPeriod } = this.props
        , { sortedData: periods } = this.state

    let adjustment

    if (!selectedPeriod) return

    if (e.key === 'ArrowDown' || e.key === 'j') adjustment = 1
    if (e.key === 'ArrowUp' || e.key === 'k') adjustment = -1

    if (adjustment) {
      e.preventDefault()

      if (this.lastAdjustment && (new Date() - this.lastAdjustment < 75)) {
        return
      }

      this.lastAdjustment = new Date()

      const nextIdx = periods.indexOf(selectedPeriod) + adjustment
          , nextPeriod = periods[nextIdx]

      if (nextPeriod) {
        setSelectedPeriod(nextPeriod)
        setHoveredPeriod(null)
        this.mouseOffset = null
        this.listRef.current.scrollToItem(nextIdx)
      }
    }
  }


  handleScroll(e) {
    const { hoveredPeriod, setHoveredPeriod } = this.props
        , { sortedData: periods } = this.state

    if (this.mouseOffset == null) return

    const pos = e.scrollOffset + this.mouseOffset
        , hoveredItemIdx = Math.floor(pos / 28)
        , nextPeriod = periods[hoveredItemIdx + 1]

    if (nextPeriod !== hoveredPeriod) {
      setHoveredPeriod(nextPeriod)
    }
  }

  async updateSort() {
    const { sortBy, sortDirection, data } = this.props
        , column = columns[sortBy]

    if (column) {
      let sortedData = null

      if (column.sort) {
        sortedData = await column.sort(data, this.props)

      } else {
        const sorter = natsort({
          insensitive: true,
          desc: sortDirection === 'desc',
        })

        sortedData = [ ...data ].sort((a, b) => {
          const [ _a, _b ] = [ a, b ].map(column.getValue)

          if (_a == null) return 1
          if (_b == null) return -1

          return sorter(_a, _b)
        })
      }

      this.setState({
        sortedData,
        start: 0,
      })

      if (this.props.fixedPeriod && this.listRef.current) {
        this.listRef.current.scrollToItem(
          sortedData.findIndex(({ id }) => id === this.props.fixedPeriod.id) + 4
        )
      }
    }
  }

  render() {
    const { rect, sortedData: periods } = this.state

    const {
      sortBy,
      sortDirection,
      updateOpts,
      hoveredPeriod,
      setHoveredPeriod,
      setSelectedPeriod,
      selectedPeriod,
      backend,
    } = this.props

    const layoutOpts = getLayoutOpts()
        , layoutParams = getLayoutParams()

    return (
      h(ListWrapper, {
        tabIndex: 0,
        onKeyDown: this.onKeyDown,
        style: {
          overflowY: rect == null ? 'scroll' : 'unset',
          position: 'relative',
          border: '1px solid #ccc',
          padding: '1px',
        },
        innerRef: el => { this.el = el },
      }, rect == null ? null : [
        h('div', {
          style: {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 'calc(1em + 20px)',
            backgroundColor: '#F8F9FA',
            borderBottom: '1px solid #ccc',
          },
        }),
        h('div', {
          className: 'row row__header',
          style: {
            width: this.state.headerWidth - 4,
          },
        }, [
          h('span', ''), // count
          h('span', ''), // view/edit
        ].concat(Object.entries(columns).map(([ key, { label }]) =>
          h('span', {
            onClick: () => {
              updateOpts((opts={}) => ({

                ...opts,
                sortBy: key,
                sortDirection: opts.sortBy === key
                  ?  (!opts.sortDirection || opts.sortDirection === 'asc') ? 'desc' : 'asc'
                  : 'asc',
              }))
            },
          }, [
            label,
            sortBy !== key ? null : (
              sortDirection === 'desc' ? '▲' : '▼'
            ),
          ])
        ))),

        h(List, {
          height: 250,
          onScroll: this.handleScroll,
          ref: this.listRef,
          innerRef: el => {
            if (!this.scrollEl && el) {
              this.scrollEl = el.parentNode

              this.scrollEl.addEventListener('mousemove', this.onMouseMove)
              this.scrollEl.addEventListener('mouseleave', () => {
                this.mouseOffset = null
              })
            }
          },
          itemData: {
            backend,
            periods,
            hoveredPeriod,
            selectedPeriod,
            setHoveredPeriod,
            setSelectedPeriod,
            layoutOpts,
            layoutParams,
            showEditLink: backend.asIdentifier().startsWith('local-'),
          },
          itemCount: periods == null ? 0 : periods.length,
          itemSize: 28,
          width: rect.width - 4,
          overscanCount: 25,
          itemKey,
        }, ItemRow),
      ])
    )
  }
}

PeriodList.defaultProps = {
  sortBy: 'start',
  sortDirection: 'asc',
}


module.exports = {
  label: 'Virtualized period list',
  description: 'Scrollable list of periods.',
  Component: PeriodList,
}
