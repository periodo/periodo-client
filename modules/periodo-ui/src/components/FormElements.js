"use strict";

const h = require('react-hyperscript')
    , { Box } = require('./Base')
    , { Alert$Error } = require('./Alerts')

const disabledStyle = {
  ':disabled': {
    cursor: 'not-allowed',
    backgroundColor: 'gray.3',
    color: 'gray.9',
  },
}

const borderStyle = {
  border: '1px solid #fff',
  borderColor: 'gray.5',
}

exports.Select = props =>
  h(Box, {
    as: 'select',
    sx: {
      bg: 'white',
      fontFamily: 'sans-serif',
      fontSize: 1,
      height: '36px',
      pl: 2,
      pr: 4,

      // This is a triangle
      appearance: 'none',
      backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right .7em top 50%',
      backgroundSize: '.65em auto',

      ...borderStyle,
      ...disabledStyle,
    },
    ...props,
  })

exports.Textarea = props =>
  h(Box, {
    as: 'textarea',
    sx: {
      p: 2,
      width: '100%',
      fontFamily: 'sans-serif',
      fontSize: 1,

      ...borderStyle,
      ...disabledStyle,
    },
    ...props,
  })

exports.Input = props =>
  h(Box, {
    as: 'input',
    sx: {
      p: 2,
      m: 0,
      fontSize: 1,
      width: '100%',

      ...borderStyle,
      ...disabledStyle,
    },
    ...props,
  })

// FIXME: Need anything more here?
exports.Checkbox = props =>
  h(Box, {
    as: 'input',
    type: 'checkbox',
    ...props,
  })

exports.Errors = ({ errors, ...props }) =>
  h(Alert$Error, {
    mb: 1,
    ...props,
  }, [
    h(Box, {
      as: 'ul',
      sx: {
        listStyleType: 'none',
      },
    }), errors.map((message, i) =>
      h(Box, {
        as: 'li',
        mt: i > 0 ? 1 : 0,
      })
    ),
  ])

exports.Label = ({ isRequired, ...props }) =>
  h(Box, {
    as: 'label',
    sx: {
      fontSize: 2,
      color: 'black',
      display: 'inline-block',
      fontWeight: 'bold',
      ':hover': !props.htmlFor ? {} : {
        cursor: 'pointer',
      },
      ':after': !isRequired ? {} : {
        content: '" \x2a        "',
        color: 'red',
      },
    },
    ...props,
  })
