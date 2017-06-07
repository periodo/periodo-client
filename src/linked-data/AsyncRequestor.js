"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { ReadyState } = require('../typed-actions/types')

const emptyState = () => ({
  readyState: null,
  onNextCompletion: [],
})

module.exports = function makeAsyncRequestor(Component) {
  return class AsyncRequestor extends React.Component {
    constructor() {
      super();

      this.curReq = 0;
      this.state = emptyState()
    }

    onNextCompletion(fn) {
      this.setState(prev => ({
        onNextCompletion: [...prev.onNextCompletion, fn]
      }))
    }

    doRequest(fetchFn, ...opts) {
      const { curReq } = this
          , { readyState } = this.state

      if (readyState) {
        throw new Error(
          'Cancel any pending requests before sending another.'
        );
      }

      this.setState({
        readyState: ReadyState.Pending()
      })

      fetchFn(...opts).then(
        resp => {
          if (curReq !== this.curReq) return;

          this.state.onNextCompletion.forEach(fn => {
            fn(null, resp);
          })

          this.setState({
            readyState: ReadyState.Success(resp),
            onNextCompletion: [],
          })
        },

        err => {
          if (curReq !== this.curReq) return;

          this.state.onNextCompletion.forEach(fn => {
            fn(err)
          })

          this.setState({
            readyState: ReadyState.Failure(err),
            onNextCompletion: [],
          })
        })
    }

    render () {
      return h(Component, Object.assign({}, this.props, this.state, {
        clearRequest: (cb) => {
          this.curReq += 1;
          this.setState({ readyState: null }, cb)
        },

        doRequest: this.doRequest.bind(this),
        onNextCompletion: this.onNextCompletion.bind(this),
      }));
    }
  }
}
