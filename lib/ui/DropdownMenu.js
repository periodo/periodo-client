"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , R = require('ramda')
    , { Box, Text } = require('axs-ui')
    , { Button } = require('./Buttons')
    , MB = require('react-aria-menubutton')
    , { Route, trigger } = require('lib/router')

exports.DropdownMenuItem = props =>
  h(MB.MenuItem, { value: props.value }, [
    h(Box, Object.assign({
      p: '10px 12px',
      _css: {
        minWidth: 200,
        ':hover': {
          cursor: 'pointer',
          backgroundColor: '#eee',
        }
      }
    }, props))
  ])

exports.DropdownMenuHeader = props =>
  h(Box, {
    p: 1,
    bg: 'gray2',
    mb: 1,
    css: {
      borderBottom: '1px solid #ccc',
    },
  }, [
    h(Text, {
      css: {
        fontWeight: 'bold',
      }
    }, props.children)
  ])


exports.DropdownMenu = class DropdownMenu extends React.Component {
  constructor() {
    super();

    this.state = {
      isOpen: false,
    }
  }

  render() {
    const { children, label, onSelection, openLeft, id } = this.props

    return (
      h(Box, Object.assign({
        _css: {
          position: 'relative',
          display: 'inline-block',
          userSelect: 'none',
        }
      }, R.omit(['children', 'label', 'onSelection', 'openLeft', 'id', 'focusMenu',], this.props)), [
        h(MB.Wrapper, {
          onMenuToggle: e => { this.setState(e) },
          onSelection: (val, e) => {
            if (val instanceof Route) {
              trigger(val);
            } else {
              onSelection(val, e)
            }
          }
        }, [
          h(MB.Button, {
            id,
            ref: el => {
              if (this.props.focusMenu) {
                document.getElementById(id).focus();
              }
            },
          }, h(Button, {
            is: 'div',
            p: '10px 20px 10px 11px',
            css: {
              opacity: this.state.isOpen ? .8 : 1,
            },
            active: this.state.isOpen,
          }, h(Text, {
            css: {
              ':after': {
                content: '"▼"',
                opacity: this.state.isOpen ? .8 : 1,
                fontSize: '11px',
                position: 'absolute',
                top: '13px',
                right: '7px',
              }
            }
          }, label || 'Menu'))),

          h(MB.Menu, {}, h(Box, {
            is: 'ul',
            p: 0,
            border: 1,
            borderColor: '#ccc',
            bg: 'white',
            css: {
              borderRadius: 2,
              position: 'absolute',
              boxShadow: '2px 1px 4px #ddd',
              [openLeft ? 'right' : 'left']: 0,
              marginTop: '3px',
              whiteSpace: 'nowrap',
              zIndex: 1,
            }
          }, children))
        ]),
      ])
    )
  }
}


exports.DropdownMenuSeparator = () =>
  h(Box, { is: 'hr', mx: '8px', my: '8px', })
