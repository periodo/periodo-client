"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box, Text } = require('axs-ui')
    , { Button } = require('./Buttons')
    , MB = require('react-aria-menubutton')

exports.DropdownMenuItem = props =>
  h(MB.MenuItem, { value: props.value }, [
    h(Box, Object.assign({
      p: '12px',
      _css: {
        minWidth: 200,
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
      display: 'inline-block',
      userSelect: 'none',
    }
  }, R.omit(['children', 'label', 'onSelection'], props)), [
    h(MB.Wrapper, {
      onSelection: (val, e) => {
        if (val.startsWith('#')) {
          window.location.hash = val;
        } else {
          props.onSelection(val, e)
        }
      }
    }, [
      h(MB.Button, {}, h(Button, {
        is: 'div',
        p: '10px 20px 10px 11px',
      }, h(Text, {
        css: {
          ':after': {
            content: '"▼"',
            fontSize: '11px',
            position: 'absolute',
            top: '13px',
            right: '7px',
          }
        }
      }, props.label || 'Menu'))),

      h(MB.Menu, {}, h(Box, {
        is: 'ul',
        p: 0,
        border: 1,
        borderColor: '#ccc',
        css: {
          position: 'absolute',
          [props.openLeft ? 'right' : 'left']: 0,
          whiteSpace: 'nowrap',
          zIndex: 1,
          background: 'white',
        }
      }, props.children))
    ]),
  ])


exports.DropdownMenuSeparator = () =>
  h(Box, { is: 'hr', mx: '8px', my: '8px', })
