"use strict";

const R = require('ramda')
    , { isTypedRequest } = require('./utils')
    , { ActionRequest, ReadyState } = require('./types')


const enforceTypedAsyncActions = (wrapExec=[]) => ({ dispatch }) => next => action => {
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
      [req._name]: (...args) => R.pipe(...[R.identity, ...wrapExec])(req.exec(...args)),
      _: R.T,
    }))
      .then(respData => {
        update(ReadyState.Success(action.responseOf(respData)))
      })
      .catch(err => update(ReadyState.Failure(err)))
  }

  return next(action)
}

module.exports = enforceTypedAsyncActions;
