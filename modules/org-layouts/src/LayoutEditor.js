"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box, Heading, Text } = require('axs-ui')

const BlockDefinitions = ({ blocks }) =>
  h(Box, { is: 'ul' }, Object.values(R.mapObjIndexed(({ label, description }, key) =>
    h(Box, {
      key,
      is: 'li',
      mb: 2,
    }, [
      h(Heading, { level: 3 }, label),
      h(Box, { my: 1 }, [
        'Type: ',
        h(Text, {
          is: 'code',
          color: 'pink5',
          bg: 'gray2',
          px: '3px',
        }, key)
      ]),
      h(Box, { is: 'p', my: 1 }, description),
    ])
  , blocks)))

class LayoutEditor extends React.Component {
  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    const { blocks } = this.props

    return (
      h(Box, { pt: 2 }, [
        h(Box, {
          style: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridGap: '.66em',
          }
        }, [
          h('textarea', {
            onSelect: e => {
              console.log(e);
            },
            rows: 25,
            value: this.state.editingLayout,
            onChange: e => this.setState({ editingLayout: e.target.value }),
          }),

          h(BlockDefinitions, { blocks }),
        ]),

        h(Box, { pt: 2 }, [
          h('button', {
            disabled: this.state.layout === this.state.editingLayout,
            onClick: () => this.setState({ layout: this.state.editingLayout })
          }, 'Update')
        ]),
      ])
    )
  }
}

module.exports = LayoutEditor
