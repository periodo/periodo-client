"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , R = require('ramda')
    , { Box, Text } = require('./Base')
    , { Button } = require('./Buttons')
    , MB = require('react-aria-menubutton')
    , { Route, Navigable } = require('org-shell')
    , { blacklist } = require('./util')

exports.DropdownMenuItem = props =>
  h(MB.MenuItem, { value: props.value }, [
    h(Box, {
      p: '10px 12px',
      css: {
        minWidth: 200,
        ':hover': {
          cursor: 'pointer',
          backgroundColor: '#eee',
        },
      },
      ...props,
    }),
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
      },
    }, props.children),
  ])


exports.DropdownMenuButton = Button.extend([], [
  props => ({
    paddingRight: '16px',
    opacity: props.isOpen ? .8 : 1,
    ':after': {
      content: '"▼"',
      opacity: props.isOpen ? .8 : 1,
      fontSize: '11px',
      position: 'relative',
      left: '5px',
      bottom: '1px',
    },
  }),
])

exports.DropdownMenuButton.defaultProps.blacklist = blacklist('isOpen')


exports.DropdownMenuMenu = props =>
  h(Box, {
    p: 0,
    border: 1,
    borderColor: '#ccc',
    bg: 'white',
    css: {
      borderRadius: 2,
      position: 'absolute',
      boxShadow: '2px 1px 4px #ddd',
      [props.openLeft ? 'right' : 'left']: 0,
      marginTop: '3px',
      whiteSpace: 'nowrap',
      zIndex: 1,
      ...props.css,
    },
    ...R.omit([ 'openLeft', 'css' ], props),
  }, props.children)


exports.DropdownMenu = Navigable(class DropdownMenu extends React.Component {
  constructor() {
    super();

    this.state = {
      isOpen: false,
    }
  }

  render() {
    const { isOpen } = this.state
        , { children, closeOnSelection, label, onSelection, openLeft, id, navigateTo } = this.props

    return (
      h(Box, {
        css: {
          position: 'relative',
          display: 'inline-block',
          userSelect: 'none',
        },
        ...R.omit([ 'navigateTo', 'closeOnSelection', 'label', 'onSelection', 'openLeft', 'id', 'focusMenu' ], this.props),
      }, [
        h(MB.Wrapper, {
          onMenuToggle: e => { this.setState(e) },
          closeOnSelection,
          onSelection: (val, e) => {
            if (val instanceof Route) {
              navigateTo(val)
            } else {
              if (onSelection) {
                onSelection(val, e)
              }
            }
          },
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
            isOpen,
            active: isOpen,
          }, label || 'Menu')),

          h(MB.Menu, {}, [
            h(exports.DropdownMenuMenu, {
              is: 'ul',
              openLeft,
            }, children),
          ]),
        ]),
      ])
    )
  }
})


exports.DropdownMenuSeparator = () =>
  h(Box, {
    is: 'hr',
    mx: '8px',
    my: '8px',
  })
