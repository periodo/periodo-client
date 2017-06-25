"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Heading, Text } = require('axs-ui')
    , Spinner = require('respin')
    , { Button } = require('lib/ui')
    , { RouterKnower } = require('lib/util/hoc')
    , MB = require('react-aria-menubutton')

const MenuItem = props =>
  h(MB.MenuItem, { value: props.value }, [
    h(Box, Object.assign({
      p: 1,
      css: {
        minWidth: 100,
        ':hover': {
          cursor: 'pointer',
          backgroundColor: '#eee',
        }
      }
    }, props))
  ])

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

    h(Box, [
      props.loadingNewPage && h(Spinner, { size: 22 }),
    ]),

    h(Box, { css: { position: 'relative', userSelect: 'none', }}, [
      h(MB.Wrapper, {
        onSelection: val => {
          if (val.startsWith('#')) {
            window.location.hash = val;
          }
        }
      }, [
        h(MB.Button, {}, h(Button, { is: 'div' }, 'Menu ▼')),

        h(MB.Menu, {}, h(Box, {
          is: 'ul',
          p: 0,
          border: 1,
          borderColor: '#ccc',
          css: {
            position: 'absolute',
            right: 0,
            whiteSpace: 'nowrap',
            zIndex: 1,
            background: 'white',
          }
        }, [
          h(MenuItem, { value: '#open-backend' }, 'Open backend'),
          h(MenuItem, { value: '#new-backend' }, 'New backend'),
          h('hr', { style: { marginLeft: '8px', marginRight: '8px' }}),
          h(MenuItem, { value: '#submitted-patches' }, 'View submitted patches'),
          h('hr', { style: { marginLeft: '8px', marginRight: '8px' }}),
          h(MenuItem, { value: '#help' }, 'Help'),
        ]))
      ]),
    ]),

  ])

module.exports = RouterKnower(Header);
