"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , natsort = require('natsort')
    , { FixedSizeList: List } = require('react-window')
    , { authorityOf } = require('periodo-utils/src/period')
    , { yearPublished } = require('periodo-utils/src/source')
    , styled = require('styled-components').default
    , { throttle } = require('throttle-debounce')

const columns = {
  start: {
    label: 'Start',
    width: '100px',

    sort: (periods, { dataset, sortDirection }) => {
      return dataset.cachedSort(periods, 'start', sortDirection === "desc")
    },

    getValue(period) {
      return period.start.label
    },

  },

  stop: {
    label: 'Stop',
    width: '100px',

    sort: (periods, { dataset, sortDirection }) => {
      return dataset.cachedSort(periods, 'stop', sortDirection === "desc")
    },

    getValue(period) {
      return period.stop.label
    },
  },

  label: {
    label: 'Label',
    sort: (periods, { dataset, sortDirection }) => {
      return dataset.cachedSort(periods, 'label', sortDirection === "desc")
    },
    getValue(period) {
      return period.label
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
    width: '132px',
    getValue(period) {
      return yearPublished(authorityOf(period).source)
    }
  },
}

const Row = styled.div`
display: flex;
align-items: center;

& span {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  padding: 0 7px;
}

& :nth-child(1) {
  width: 8ch;
}

& :nth-child(2),
& :nth-child(3) {
  width: 160px;
}

& :nth-child(4),
& :nth-child(5) {
  flex: 1;
}

& :nth-child(6) {
  width: 132px;
}
`

const BodyRow = styled(Row)`
&[data-selected="true"] {
  background-color: #f0f0f0;
}
`

const HeaderRow = styled(Row)`
font-weight: bold;
margin-bottom: 1px;

z-index: 1;

& span {
  z-index: 1;
  cursor: pointer;
  padding: 8px 0;
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
    periods,
    hoveredPeriod,
    selectedPeriod,
    setHoveredPeriod,
    setSelectedPeriod,
  },
}) {
  const period = periods[index]

  return (
    h(BodyRow, {
      style: Object.assign({}, style, {
        backgroundColor: (
          hoveredPeriod === period ||
          selectedPeriod === period
        )? '#f0f0f0' : 'unset',
      }),
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
      h('span', index + 1),
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

    this.onMouseMove = this.onMouseMove.bind(this)
    this.handleScroll = throttle(50, this.handleScroll.bind(this))
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
      this.updateSort()
    }
  }

  componentWillUnmount() {
    this.scrollEl.removeEventListener('mousemove', this.onMouseMove)
  }

  onMouseMove(e) {
    this.mouseOffset = e.y - this.scrollEl.getBoundingClientRect().y - 34
  }

  handleScroll(e) {
    const { hoveredPeriod, setHoveredPeriod } = this.props
        , { sortedData: periods } = this.state

    if (this.mouseOffset == null) return

    const pos = e.scrollOffset + this.mouseOffset
        , hoveredItemIdx = Math.floor(pos / 28)
        , nextPeriod = periods[hoveredItemIdx]

    if (nextPeriod !== hoveredPeriod) {
      setHoveredPeriod(nextPeriod)
    }
  }

  async updateSort() {
    const { sortBy, sortDirection, data } = this.props
        , column = columns[sortBy]

    if (column) {
      if (column.sort) {
        const sortedData = await column.sort(data, this.props)
        this.setState({ sortedData, start: 0 })
      } else {
        const sorter = natsort({
          insensitive: true,
          desc: sortDirection === 'desc',
        })

        const sortedData = [...data].sort((a, b) => {
          const [_a, _b] = [a, b].map(column.getValue)

          if (_a == null) return 1
          if (_b == null) return -1

          return sorter(_a, _b)
        })

        this.setState({ sortedData, start: 0 })
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
    } = this.props

    return (
      h('div', {
        style: {
          overflowY: rect == null ? 'scroll' : 'unset',
          position: 'relative',
          border: '1px solid #ccc',
          padding: '1px',
        },
        ref: el => { this.el = el },
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
        h(HeaderRow, {
          style: {
            width: this.state.headerWidth - 4,
          },
        }, [
          h('span', ''),
        ].concat(Object.entries(columns).map(([key, { label }]) =>
          h('span', {
            onClick: () => {
              updateOpts((opts={}) => Object.assign(
                {},
                opts,
                {
                  sortBy: key,
                  sortDirection: opts.sortBy === key
                    ?  (!opts.sortDirection || opts.sortDirection === 'asc') ? 'desc' : 'asc'
                    : 'asc'
                }
              ))
            }
          }, [
            label,
            sortBy !== key ? null : (
              sortDirection === 'desc' ? '▲' : '▼'
            )
          ])
        ))),

        h(List, {
          height: 250,
          onScroll: this.handleScroll,
          innerRef: el => {
            debugger;
            if (!this.scrollEl && el) {
              this.scrollEl = el.parentNode

              this.scrollEl.addEventListener('click', e => {
                console.log(e)
              })

              this.scrollEl.addEventListener('mousemove', this.onMouseMove)
            }
          },
          itemData: {
            periods,
            hoveredPeriod,
            selectedPeriod,
            setHoveredPeriod,
            setSelectedPeriod,
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
  sortBy: 'label',
  sortDirection: 'asc',
}


module.exports = {
  label: 'Virtualized period list',
  description: 'Scrollable list of periods.',
  Component: PeriodList,
}