"use strict";

const h = require('react-hyperscript')
    , { Box, Heading, Text } = require('axs-ui')
    , { Link } = require('periodo-ui')

module.exports = ({ blocks, onSelect }) =>
  h(Box, [
    h(Heading, { level: 3 }, 'Choose layout'),

    h(Box, Object.keys(blocks).map(key =>
      h(Box, { is: 'ul', key },
        h(Box, { is: 'li', mb: 2, }, [
          h(Link, {
            href: '#',
            onClick: e => {
              e.preventDefault();

              onSelect(key);
            }
          }, [
            h(Heading, { level: 4 }, blocks[key].label),
          ]),

          h(Text, blocks[key].description),
        ])
      )
    ))
  ])
