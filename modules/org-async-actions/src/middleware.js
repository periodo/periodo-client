"use strict";

const R = require('ramda')
    , { isTypedRequest } = require('./utils')
    , { ReadyState } = require('./types')


const enforceTypedAsyncActions = extraArgs => (
  { dispatch, getState }) => next => action => {

  if (!action.readyState && !isTypedRequest(action)) {
    throw new Error('Actions should be called by creating a union type record.')
  }

  if (isTypedRequest(action)) {
    const req = action

    const update = readyState => dispatch({
      type: req,
      readyState,
    })

    update(ReadyState.Pending)

    return Promise.resolve(req.case({
      [req._name]: (...args) => {
        let ret = req.exec(...args)

        if (typeof ret === 'function') {
          ret = ret(dispatch, getState, extraArgs)
        }

        return ret;
      },
      _: R.T,
    }))
      .then(respData => update(ReadyState.Success(action.responseOf(respData))))
      .catch(err => update(ReadyState.Failure(err)))
  }

  return next(action)
}

module.exports = enforceTypedAsyncActions;
