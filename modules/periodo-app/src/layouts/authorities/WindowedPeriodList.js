"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , natsort = require('natsort').default
    , { FixedSizeList: List } = require('react-window')
    , AutoSizer = require('react-virtualized-auto-sizer')
    , { authorityOf } = require('periodo-utils/src/period')
    , { yearPublished } = require('periodo-utils/src/source')
    , styled = require('@emotion/styled').default
    , { Link, Text, Label, HelpText } = require('periodo-ui')
    , { Route } = require('org-shell')

function getReturnToURL() {
  const { search, hash } = window.location

  return search + hash
}

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

.row__header {
  font-weight: bold;
  z-index: 1;
  background-color: ${props => props.theme.colors.colorsets.secondary.bg};
  color: ${props => props.theme.colors.colorsets.secondary.fg};
}

.row__header span {
  z-index: 1;
  cursor: pointer;
  padding: 8px 7px !important;
}

.row {
  display: flex;
  align-items: center;
}

.row > span:nth-of-type(1) {
  flex: 0 0 6ch;
}

.row span:nth-of-type(2) {
  flex: 0 0 10ch;
}

.row span:nth-of-type(3) {
  flex: 1 0 20ch;
}

.row span:nth-of-type(4) {
  flex: 0 1 20ch;
}

.row span:nth-of-type(5) {
  flex: 0 1 20ch;
}

.row span:nth-of-type(6) {
  flex: 1 1 30ch;
}

.row span:nth-of-type(7) {
  flex: 0 0 12ch;
}

.row__item {
  background-color: ${props => props.theme.colors.colorsets.table.bg};
  color: ${props => props.theme.colors.colorsets.table.fg};
}

.row__item[data-selected="true"] {
  background-color: ${props => props.theme.colors.colorsets.tableFocused.bg};
  color: ${props => props.theme.colors.colorsets.tableFocused.fg};
}

.row__item[data-faux-hovered="true"],
.row__item[data-hovered="true"] {
  border-top: 1px solid ${props => props.theme.colors.colorsets.table.border};
  border-bottom: 1px solid ${props => props.theme.colors.colorsets.table.border};
}

.row span {
  overflow: hidden;
  padding: 0 7px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`

function ItemRow({
  index,
  style,
  data: {
    backend,
    periods,
    hoveredPeriod,
    selectedPeriod,
    isHovering,
    setIsHovering,
    setHoveredPeriod,
    setSelectedPeriod,
    showEditLink,
    isFixed,
  },
}) {
  const period = periods[index]

  const toggleSelectedPeriod = () => {
    setSelectedPeriod(
      (selectedPeriod && selectedPeriod.id === period.id)
        ? null
        : period
    )
  }

  const isFauxHovered = (
    !isHovering &&
    hoveredPeriod === period &&
    !(
      selectedPeriod &&
      periods.includes(selectedPeriod)
    )
  )

  return (
    h('div', {
      className: 'row row__item',
      style,
      ['data-selected']: selectedPeriod === period,
      ['data-hovered']: isHovering && hoveredPeriod === period,
      ['data-faux-hovered']: isFauxHovered,
      onMouseDown: e => {
        if (e.target.nodeName === 'A') return
        if (isFixed) return
        toggleSelectedPeriod()
      },
      onTouchStart: toggleSelectedPeriod,
      onMouseEnter: () => {
        setHoveredPeriod(period)
        setIsHovering(true)
      },
      onMouseLeave: () => {
        setIsHovering(false)
      },
    }, [
      h('span', [
        h(Text, {
          color: 'gray.6',
        }, index + 1),
      ]),
      h('span', [
        h(Link, {
          fontWeight: 100,
          route: new Route('period-view', {
            backendID: backend.asIdentifier(),
            authorityID: authorityOf(period).id,
            periodID: period.id,
          }),
        }, 'view'),
        showEditLink
          ? h(Link, {
            ml: 2,
            fontWeight: 100,
            route: new Route('period-edit', {
              backendID: backend.asIdentifier(),
              authorityID: authorityOf(period).id,
              periodID: period.id,
              returnTo: getReturnToURL(),
            }),
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

const findPeriodIndex = (period, sortedData) => (period && sortedData)
  ? sortedData.findIndex(({ id }) => id === period.id)
  : -1

class PeriodList extends React.Component {
  constructor() {
    super()

    this.state = {
      sortedData: null,
      scrollNeedsUpdate: false,
    }

    this.onKeyDown = this.onKeyDown.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.updateScroll = this.updateScroll.bind(this)

    this.wrapperRef = { current: null }
    this.listRef = { current: null }
  }

  componentDidUpdate(prevProps) {
    const updateSort = (
      prevProps.sortBy !== this.props.sortBy ||
      prevProps.sortDirection !== this.props.sortDirection ||
      prevProps.data !== this.props.data
    )

    if (updateSort) {
      this.updateSort()
    }

    this.updateScroll()
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
    const {
      sortBy,
      sortDirection,
      setHoveredPeriod,
      data,
    } = this.props

    const column = columns[sortBy]

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
        scrollNeedsUpdate: !!this.props.selectedPeriod,
      }, () => {
        if (sortedData.length) {
          setHoveredPeriod(sortedData[0])
        } else {
          setHoveredPeriod(null)
        }
      })
    }
  }

  updateScroll() {
    const mustUpdate = (
      this.wrapperRef.current &&
      this.listRef.current &&
      this.state.scrollNeedsUpdate
    )

    if (mustUpdate) {
      const index = findPeriodIndex(
        this.props.selectedPeriod,
        this.state.sortedData
      )

      if (index !== -1) {
        this.listRef.current.scrollToItem(Math.max(index, 0), 'center')
      }

      this.setState({ scrollNeedsUpdate: false })
    }
  }

  render() {
    if (this.props.hidden) {
      return null
    }

    const { sortedData: periods } = this.state

    const {
      sortBy,
      sortDirection,
      updateOpts,
      hoveredPeriod,
      setHoveredPeriod,
      selectedPeriod,
      setSelectedPeriod,
      isFixed,
      backend,
      totalCount,
      isHovering,
      setIsHovering,
      opts: { fixed },
    } = this.props

    const itemCount = periods ? periods.length : 0
        , filteredCount = totalCount === undefined
          ? undefined
          : totalCount - itemCount

    return h('div', [
      ...(fixed === 'true'
        ? []
        : [

          h(Label, { key: 'label' }, `${itemCount} periods`),

          filteredCount !== undefined && filteredCount > 0 && h(Text, {
            color: 'gray.6',
            fontSize: 1,
          }, `${ filteredCount } periods not shown.
 Adjust filters to see more`),

          itemCount === 0 ? null : (
            h(HelpText, {
              key: 'help',
              mb: 2,
            }, [
              'Click a period to select it, ',
              'then use up and down arrows to change the selection',
            ])
          ),
        ]
      ),

      itemCount > 0 && h(AutoSizer, {
        key: 'list-wrapper',
        disableHeight: true,
      }, [
        ({ width }) => h(ListWrapper, {
          tabIndex: 0,
          onKeyDown: this.onKeyDown,
          ref: el => {
            this.wrapperRef.current = el
            this.updateScroll()
          },
          style: {
            overflowY: 'unset',
            position: 'relative',
          },
        }, [
          h('div', {
            style: {
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 'calc(1em + 20px)',
              backgroundColor: '#f1f3f5',
            },
          }),
          h('div', {
            className: 'row row__header',
            style: { width },
          }, [
            h('span', { style: { cursor: 'default' }}, ''), // count
            h('span', { style: { cursor: 'default' }}, ''), // view/edit
          ].concat(Object.entries(columns).map(
            ([ key, { label }]) => h('span', {
              onClick: () => {
                updateOpts((opts={}) => ({
                  ...opts,
                  sortBy: key,
                  sortDirection: opts.sortBy === key
                    ? (!opts.sortDirection || opts.sortDirection === 'asc')
                      ? 'desc'
                      : 'asc'
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
            height: 200,
            style: { overscrollBehaviorY: 'contain' },
            onScroll: this.handleScroll,
            onItemsRendered: this.updateScroll,
            ref: list => {
              this.listRef.current = list
              this.updateScroll()
            },
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
              isHovering,
              setIsHovering,
              setHoveredPeriod,
              setSelectedPeriod,
              isFixed,
              showEditLink: backend.asIdentifier().startsWith('local-'),
            },
            itemCount,
            itemSize: 28,
            width,
            overscanCount: 25,
            itemKey,
          }, ItemRow),
        ]),
      ]),
    ])
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
  keepMounted: true,
}
