"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { ReadyState } = require('../typed-actions/types')

module.exports = function makeAsyncRequestor(Component) {
  return class AsyncRequestor extends React.Component {
    constructor() {
      super();

      this.state = {
        readyState: null,
      }

      this.curReq = 0;
    }

    doRequest(fetchFn, ...opts) {
      const { curReq } = this

      if (this.state.readyState) {
        throw new Error(
          'Cancel any pending requests before sending another.'
        );
      }

      this.setState({ readyState: ReadyState.Pending() })

      fetchFn(...opts).then(
        resp => {
          if (curReq !== this.curReq) return;

          this.setState({
            readyState: ReadyState.Success(resp)
          })
        },

        err => {
          if (curReq !== this.curReq) return;

          this.setState({
            readyState: ReadyState.Failure(err)
          })
        })
    }

    render () {
      return h(Component, Object.assign({}, this.props, this.state, {
        clearRequest: (cb) => {
          this.curReq += 1;
          this.setState({ readyState: null }, cb)
        },

        doRequest: this.doRequest.bind(this)
      }));
    }
  }
}
