"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Flex, Box, Heading, Text } = require('periodo-ui')
    , Spinner = require('respin')
    , { DropdownMenu, DropdownMenuItem } = require('periodo-ui')
    , { Route } = require('org-shell')

module.exports = props =>
  h(Box.withComponent('header'), R.omit(['showSpinner'], props), [
    h(Flex, {
      height: '100%',
      alignItems: 'center',
      justifyContent: 'space-around',
      p: 1,
    }, [
      h(Box, [
        h(Heading, {
          level: 1,
          m: 0,
          mr: 2,
          fontSize: 3,
        }, [

          h('a', {
            href: '',
          }, h('img', {
            src: 'images/periodo-logo.svg',
            height: 32,
          }))
        ]),
      ]),

      h(Box, { width: 22 }, [
        props.showSpinner && h(Spinner, { size: 22 }),
      ]),

      h(Box, ' '),
    ])
  ])
