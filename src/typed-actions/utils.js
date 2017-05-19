"use strict";

const { $$ActionType, $$ReadyState } = require('./symbols')

function isUnionTypeRecord(obj) {
  return (
    Array.isArray(obj._keys) &&
    typeof obj._name === 'string' &&
    typeof obj.case === 'function'
  )
}

function getActionType(action) {
  return action[$$ActionType]
}

function getReadyState(action) {
  return action[$$ReadyState]
}

function getModule(action) {
  const Type = getActionType(action);

  return Type ? Type.module : null
}

function isInModule(action, moduleString) {
  return getModule(action) === moduleString
}

function readyStateCase(action, cases) {
  return getReadyState(action).case(cases)
}

function moduleActionCase(action, cases) {
  return getActionType(action).case(cases)
}

function getResponse(action) {
  return readyStateCase(action, {
    Success: resp => resp,
    _: () => {
      throw new Error('Ready state of action was not \'Success\'.')
    }
  })
}

function getError(action) {
  return readyStateCase(action, {
    Failure: err => err,
    _: () => {
      throw new Error('Ready state of action was not \'Failure\'.')
    }
  })
}

function handleCompletedAction(action, onSuccess, onError) {
  return readyStateCase(action, {
    Success: onSuccess,
    Failure: onError,
    Pending: () => {
      throw new Error(
        'Ready state of action was pending. This can only be ' +
        'called on a completed action.')
    }
  })
}

module.exports = {
  isUnionTypeRecord,
  getModule,
  getReadyState,
  isInModule,
  readyStateCase,
  moduleActionCase,
  getResponse,
  getError,
  handleCompletedAction,
}
