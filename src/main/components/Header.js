"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Heading, Text } = require('axs-ui')
    , Spinner = require('respin')
    , { Button, DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } = require('lib/ui')
    , { RouterKnower } = require('lib/util/hoc')
    , MB = require('react-aria-menubutton')

const Header = props =>
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
          href: '#/',
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
      h(DropdownMenuItem, { value: '#open-backend' }, 'Backends'),
      h(DropdownMenuItem, { value: '#submitted-patches' }, 'Patches'),
      h(DropdownMenuItem, { value: '#help' }, 'Help'),
    ])
  ])

module.exports = RouterKnower(Header);
