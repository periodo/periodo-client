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
  render() {
    const { blocks, value, onChange } = this.props

    return (
      h(Box, {
        style: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridGap: '.66em',
        }
      }, [
        h('textarea', {
          style: {
            padding: '.7em',
          },
          onSelect: e => {
            /*
             * TODO: Allow moving along grid tracks
            const { selectionStart, selectionEnd } = e.target
            console.log(selectionStart, selectionEnd);
            */
          },
          rows: 25,
          value,
          onChange,
        }),

        h(BlockDefinitions, { blocks }),
      ])
    )
  }
}

module.exports = LayoutEditor
