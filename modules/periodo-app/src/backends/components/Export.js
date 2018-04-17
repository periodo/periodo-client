"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , Type = require('union-type')
    , { Flex, Span, Box, Heading } = require('axs-ui')
    , { asJSONLD, asTurtle } = require('../../linked-data/utils/data')

const ReadyState = Type({
  Pending: {},
  Success: [String],
  Error: [String],
})

class ExportData extends React.Component {
  constructor() {
    super();

    this.state = {
      selected: null,
      representation: null,
    }

    this.setRepresentation = this.setRepresentation.bind(this);
  }

  setRepresentation() {
    const { selected } = this.state
        , { period, authority, backend } = this.props
        , toExport = period || authority || backend

    if (selected === 'JSON-LD') {
      this.setState({
        representation: ReadyState.Success(
          JSON.stringify(asJSONLD(toExport), true, '  ')
        )
      })
    } else if (selected === 'Turtle') {
      asTurtle(toExport, true).then(
        ttl => this.setState({
          representation: ReadyState.Success(ttl)
        }),
        err => this.setState({
          representation: ReadyState.Error(err.toString())
        })
      )
    }

  }

  render() {
    const { selected, representation } = this.state
        , { period, authority, backend } = this.props
        , toExport = period || authority || backend

    const options = ['JSON-LD', 'Turtle']

    if (toExport === authority) {
      options.push('CSV')
    }

    return [
      h(Heading, { key: 'title', level: 2 }, 'Export'),
      h(Flex, {
        key: 'tabs',
        my: 2,
        alignItems: 'center',
      }, [
        h(Span, {
          key: 1,
          css: { fontWeight: 'bold' },
          mr: 2,
        }, 'Format:'),
      ].concat(options.map(type => [
        h(Box, {
          key: type,
          css: { cursor: 'pointer' },
          border: 1,
          borderColor: 'gray',
          px: 2,
          py: 1,
          ml: '-1px',
          backgroundColor: selected === type ? '#eee' : undefined,
          onClick: () => this.setState({
            selected: type,
            representation: ReadyState.Pending
          }, this.setRepresentation)
        }, type)
      ]))),
      selected && h(Box, { key: 'repr' }, [
        representation.case({
          Pending: () => 'Loading...',
          Success: data => h(Box, {
            is: 'pre',
            mt: 2,
            bg: 'gray1',
            css: { whiteSpace: 'pre-wrap' },
            p: 2,
          }, data),
          Failure: error => h(Box, {}, 'ERROR: ' + error)
        })
      ])
    ]
  }
}

module.exports = ExportData
