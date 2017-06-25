"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , { Button } = require('./Buttons')
    , MB = require('react-aria-menubutton')

exports.DropdownMenuItem = props =>
  h(MB.MenuItem, { value: props.value }, [
    h(Box, Object.assign({
      p: '12px',
      css: {
        minWidth: 100,
        ':hover': {
          cursor: 'pointer',
          backgroundColor: '#eee',
        }
      }
    }, props))
  ])

exports.DropdownMenu = props =>
  h(Box, Object.assign({
    _css: {
      position: 'relative',
      userSelect: 'none',
    }
  }, R.omit(['children'], props)), [
    h(MB.Wrapper, {
      onSelection: props.onSelection,
    }, [
      h(MB.Button, {}, h(Button, { is: 'div', p: '12px' }, 'Menu ▼')),

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
      }, props.children))
    ]),
  ])


exports.DropdownMenuSeparator = props =>
  h(Box, { is: 'hr', mx: '8px', my: '8px', })
