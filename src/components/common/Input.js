"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , randomstr = require('../../utils/randomstr')

function Input(props) {
  const id = props.id || props.name + '-' + randomstr()

  const inputProps = Object.assign({}, props, {
    id,
    type: 'text'
  })

  return (
    h('label', [
      props.label,
      h('input', inputProps)
    ])
  )
}

Input.propTypes = {
  id: React.PropTypes.string,
  name: React.PropTypes.string.isRequired,
  label: React.PropTypes.string.isRequired,
  value: React.PropTypes.string,
  disabled: React.PropTypes.bool,
  placeholder: React.PropTypes.string,
  onChange: React.PropTypes.func.isRequired
}

module.exports = Input;
