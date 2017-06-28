"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Heading, Text } = require('axs-ui')
    , Spinner = require('respin')
    , { DropdownMenu, DropdownMenuItem } = require('lib/ui')
    , { Route } = require('lib/router')

module.exports = props =>
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
          src: 'assets/periodo-logo.svg',
          css: {
            height: 32,
          }
        }))
      ]),
    ]),

    h(Box, { width: 22 }, [
      props.loadingNewPage && h(Spinner, { size: 22 }),
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
