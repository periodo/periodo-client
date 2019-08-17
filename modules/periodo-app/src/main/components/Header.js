"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Flex, Box, Heading } = require('periodo-ui')
    , Spinner = require('respin')

module.exports = props =>
  h(Box.withComponent('header'), R.omit([ 'showSpinner' ], props), [
    h(Flex, {
      height: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 1,
    }, [
      h(Box, [
        h(Heading, {
          level: 1,
          mx: 3,
          fontSize: 3,
        }, [

          h('a', {
            href: '',
          }, h('img', {
            src: 'images/periodo-logo.svg',
            height: 32,
          })),
        ]),
      ]),

      h(Box, { width: 22 }, [
        props.showSpinner && h(Spinner, { size: 22 }),
      ]),

      h(Box, ' '),
    ]),
  ])
