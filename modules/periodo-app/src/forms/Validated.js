"use strict";

const h = require('react-hyperscript')
    , React = require('react')

module.exports = function makeValidated(validationFn, Component) {
  return class Validated extends React.Component {
    constructor() {
      super();

      this.state = {
        errors: {},
      }
    }

    validate(data, onSuccess) {
      this.clearErrors.call(this, () => {
        validationFn(data).case({
          Ok: onSuccess,
          Err: errors => this.setState({ errors }),
        })
      })
    }

    clearErrors(cb) {
      this.setState({ errors: {} }, cb)
    }

    render() {
      return (
        h(Component, Object.assign({}, this.props, {
          errors: this.state.errors,
          validate: this.validate.bind(this),
          clearErrors: this.clearErrors.bind(this),
        }))
      )
    }
  }
}
