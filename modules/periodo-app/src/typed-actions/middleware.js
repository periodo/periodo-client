"use strict";

const { $$ActionType, $$ReadyState } = require('./symbols')
    , { isUnionTypeRecord } = require('./utils')

const unionTypeMiddleware = () => next => action => {
  if (action.constructor === Object) {
    if (!isUnionTypeRecord(action)) {
      throw new Error('Actions should be called by creating a union type record.')
    }

    // FIXME: require doing the makeActionType thing everywhere
    const nextAction = {
      [$$ActionType]: action.type,
      [$$ReadyState]: action.readyState,
      type: action.type._name,
      requestID: action.requestID,
      readyState: action.readyState._name,
    }

    return next(nextAction);
  }
}

module.exports = unionTypeMiddleware;
