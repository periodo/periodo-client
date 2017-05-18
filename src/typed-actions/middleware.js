"use strict";

const { isUnionTypeRecord } = require('./utils')

const unionTypeMiddleware = store => next => action => {
  if (action.constructor === Object) {
    if (!isUnionTypeRecord(action)) {
      throw new Error('Actions should be called by creating a union type record.')
    }

    // FIXME: require doing the makeActionType thing everywhere
    const nextAction = {
      [Symbol.for('Type')]: action.type,
      type: action.type._name,
      requestID: action.requestID,
      readyState: action.readyState
    }

    return next(nextAction);
  }
}

module.exports = unionTypeMiddleware;
