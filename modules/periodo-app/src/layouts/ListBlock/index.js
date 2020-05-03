"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , natsort = require('natsort')
    , { Box, Text, Pager } = require('periodo-ui')
    , ListControls = require('./ListControls')
    , ListHeader = require('./ListHeader')
    , ListRow = require('./ListRow')

module.exports = function makeList(opts) {
  const {
    label,
    description,
    defaultOpts={},
    columns,
    itemViewRoute,
    itemEditRoute,
  } = opts

  const withDefaults = obj => ({
    start: 0,
    limit: 25,
    shownColumns: Object.keys(columns),
    ...defaultOpts,
    ...obj,
  })

  class List extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        sortedData: null,
      }
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

    async updateSort() {
      const { sortBy, sortDirection, data } = this.props
          , column = columns[sortBy]

      if (column) {
        if (column.sort) {
          const sortedData = await column.sort(data, this.props)
          this.setState({ sortedData })
        } else {
          const sorter = natsort({
            insensitive: true,
            desc: sortDirection === 'desc',
          })

          const sortedData = [ ...data ].sort((a, b) => {
            let [ _a, _b ] = [ a, b ]
              .map(column.getValue)

            if (column.getSortValue) {
              [ _a, _b ] = [ _a, _b ].map(column.getSortValue)
            }

            if (_a == null) return 1
            if (_b == null) return -1

            return sorter(_a, _b)
          })

          this.setState({ sortedData })
        }
      } else {
        this.setState({ sortedData: data })
      }
    }

    render() {
      const {
        backend,
        shownColumns,
        sortBy,
        sortDirection,
        limit,
        updateOpts,
      } = this.props

      const { sortedData: items } = this.state
          , total = items ? items.length : 0

      return h(Pager, {
        total,
        limit,
        render({
          start,
          limit,
          shown,
          toPrevPage,
          toNextPage,
          toFirstPage,
          toLastPage,
        }) {

          return (
            h(Box, {
              tabIndex: 0,
              onKeyDown: e => {
                if (e.key === 'ArrowLeft') toPrevPage();
                if (e.key === 'ArrowRight') toNextPage();
              },
            }, [
              h(ListControls, {
                start,
                limit,
                total,
                shown,
                columns,
                shownColumns,
                toPrevPage,
                toNextPage,
                toFirstPage,
                toLastPage,
                updateOpts,
              }),

              h(Box, {
                is: 'table',
                css: {
                  tableLayout: 'fixed',
                  width: '100%',
                  borderCollapse: 'collapse',
                },
              }, [

                h(ListHeader, {
                  columns,
                  shownColumns,
                  sortBy,
                  sortDirection,
                  firstColumnWidth: backend.isEditable()
                    ? '112px'
                    : '80px',
                  updateOpts,
                  toFirstPage,
                }),

                h('tbody',
                  (items || []).slice(start, start + shown).map(
                    (item, index) => h(ListRow, {
                      item,
                      index,
                      start,
                      columns,
                      shownColumns,
                      backend,
                      itemViewRoute,
                      itemEditRoute,
                    })
                  )
                ),
              ]),

              items && shown > 0 ? null : (
                h(Text, {
                  align: 'center',
                  fontSize: 4,
                  p: 2,
                }, 'No items to display')
              ),

              items ? null : (
                h(Text, {
                  align: 'center',
                  fontSize: 4,
                  p: 2,
                }, 'Loading...')
              ),
            ])
          )
        },
      })
    }
  }

  return {
    label,
    description,
    processOpts: withDefaults,
    defaultOpts,
    Component: List,
  }
}
