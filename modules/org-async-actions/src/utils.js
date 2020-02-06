"use strict";

const { $$TypedRequest } = require('./symbols')

function isTypedRequest(obj) {
  return (typeof obj === 'object') && $$TypedRequest in obj
}

function isUnionTypeRecord(obj) {
  return (
    Array.isArray(obj._keys) &&
    typeof obj._name === 'string' &&
    typeof obj.case === 'function'
  )
}

function getResponse(action) {
  return action.readyState.case({
    Success: resp => resp,
    _: () => {
      throw new Error('Ready state of action was not \'Success\'.')
    },
  })
}

function getError(action) {
  return action.readyState.case({
    Failure: err => err,
    _: () => {
      throw new Error('Ready state of action was not \'Failure\'.')
    },
  })
}

function handleCompletedAction(action, onSuccess, onError) {
  return action.readyState.case({
    Success: onSuccess,
    Failure: onError,
    Pending: () => {
      throw new Error(
        'Ready state of action was pending. This can only be ' +
        'called on a completed action.')
    },
  })
}

module.exports = {
  isTypedRequest,
  isUnionTypeRecord,
  getResponse,
  getError,
  handleCompletedAction,
}
