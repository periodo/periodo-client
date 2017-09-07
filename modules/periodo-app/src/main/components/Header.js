"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Flex, Box, Heading, Text } = require('axs-ui')
    , Spinner = require('respin')
    , { DropdownMenu, DropdownMenuItem } = require('periodo-ui')
    , { Route } = require('org-shell')

module.exports = props =>
  h(Box, Object.assign({
    is: 'header',
  }, R.omit(['showSpinner'], props)), [
    h(Flex, {
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
          css: {
            fontWeight: 100
          }
        }, [

          h(Text, {
            is: 'a',
            href: '',
            color: 'blue',
            css: {
              textDecoration: 'none',
            }
          }, h(Text, {
            is: 'img',
            src: 'images/periodo-logo.svg',
            css: {
              height: 32,
            }
          }))
        ]),
      ]),

      h(Box, { width: 22 }, [
        props.showSpinner && h(Spinner, { size: 22 }),
      ]),

      h(DropdownMenu, {
        label: 'Menu',
        openLeft: true,
      }, [
        h(DropdownMenuItem, { value: Route('open-backend') }, 'Backends'),
        h(DropdownMenuItem, { value: Route('submitted-patches') }, 'Patches'),
        h(DropdownMenuItem, { value: Route('help') }, 'Help'),
      ])
    ])
  ])
