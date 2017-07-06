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


exports.DropdownMenuButton = props =>
  h(Button, Object.assign({
    pr: '12px',
    css: Object.assign({
      opacity: props.isOpen ? .8 : 1,
    }, props.css),
  }, R.omit(['isOpen', 'label', 'css'], props)), h(Text, {
    css: {
      ':after': {
        content: '"▼"',
        opacity: props.isOpen ? .8 : 1,
        fontSize: '11px',
        position: 'relative',
        left: '5px',
        bottom: '1px',
      }
    }
  }, props.label || 'Menu'))


exports.DropdownMenuMenu = props =>
  h(Box, Object.assign({
    p: 0,
    border: 1,
    borderColor: '#ccc',
    bg: 'white',
    css: Object.assign({
      borderRadius: 2,
      position: 'absolute',
      boxShadow: '2px 1px 4px #ddd',
      [props.openLeft ? 'right' : 'left']: 0,
      marginTop: '3px',
      whiteSpace: 'nowrap',
      zIndex: 1,
    }, props.css)
  }, R.omit(['children', 'css'], props)), props.children)


exports.DropdownMenu = class DropdownMenu extends React.Component {
  constructor() {
    super();

    this.state = {
      isOpen: false,
    }
  }

  render() {
    const { isOpen } = this.state
        , { children, label, onSelection, openLeft, id } = this.props

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
            style: {
              display: 'inline-block',
            },
            ref: () => {
              if (this.props.focusMenu) {
                document.getElementById(id).focus();
              }
            },
          }, h(exports.DropdownMenuButton, {
            is: 'div',
            p: '10px 20px 10px 11px',
            label,
            isOpen,
            active: isOpen,
          })),

          h(MB.Menu, {}, [
            h(exports.DropdownMenuMenu, {
              is: 'ul',
              openLeft,
            }, children)
          ])
        ]),
      ])
    )
  }
}


exports.DropdownMenuSeparator = () =>
  h(Box, { is: 'hr', mx: '8px', my: '8px', })
