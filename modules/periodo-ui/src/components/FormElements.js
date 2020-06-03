"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , sys = require('system-components').default
    , { themeGet } = require('styled-system')
    , { Box } = require('./Base')
    , { Alert$Error } = require('./Alerts')

const disabled = props => ({
  ':disabled': {
    cursor: 'not-allowed',
    backgroundColor: themeGet('colors.gray.3')(props),
    color: 'gray.9',
  },
})

exports.Select = sys({
  is: 'select',
  bg: 'gray.1',
  border: 'none',
  borderRadius: 0,
  display: 'block',
  fontFamily: 'sans-serif',
  fontSize: 1,
  height: 36,
  pl: 2,
  pr: 4,
  css: {
    appearance: 'none',
    backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right .7em top 50%',
    backgroundSize: '.65em auto',
  },
}, 'minWidth', 'maxWidth', disabled)

exports.Textarea = sys({
  is: 'textarea',
  p: 2,
  border: 'none',
  bg: 'gray.1',
  width: '100%',
  fontFamily: 'sans-serif',
  fontSize: 1,
}, 'minWidth', 'maxWidth', disabled)

exports.Input = sys({
  is: 'input',
  p: 2,
  m: 0,
  fontSize: 1,
  width: '100%',
  border: 'none',
  bg: 'gray.1',
}, 'minWidth', 'maxWidth', disabled)

exports.Checkbox = props => h('input', {
  type: 'checkbox',
  ...props,
})

exports.Errors = props =>
  h(Alert$Error, {
    mb: 1,
    ...R.omit([ 'errors' ], props),
  },
  h(Box, {
    is: 'ul',
    css: { listStyleType: 'none' },
  }, props.errors.map((message, i) =>
    h(Box, {
      is: 'li',
      mt: i > 0 ? 1 : 0,
    }, message)
  ))
  )

exports.Label = sys({
  is: 'label',
  blacklist: [ 'isRequired' ],
  fontSize: 2,
  color: 'black',
  display: 'inline-block',
  fontWeight: 'bold',
}, props => ({
  ':hover': {
    cursor: props.htmlFor ? 'pointer' : 'auto',
  },
  ':after': !props.isRequired ? {} : {
    content: '" \x2a        "',
    color: 'red',
  },
}))
