"use strict";

const Type = require('union-type')

const ReadyState = Type({
  Pending: {},
  Success: { response: Object },
  Failure: { error: Error},
})

function isUnionTypeRecord(obj) {
  return (
    Array.isArray(obj._keys) &&
    typeof obj._name === 'string' &&
    typeof obj.case === 'function'
  )
}

const ActionRequest = Type({ ActionRequest: {
  type: isUnionTypeRecord,
  requestID: Number,
  readyState: ReadyState,
}})

let id = 0;

function makeAsyncActionCreator(type, fn) {
  const requestID = id++

  const func = async (dispatch, ...args) => {
    const update = readyState => dispatch(ActionRequest.ActionRequestOf({
      type,
      requestID,
      readyState,
    }))

    update(ReadyState.Pending());

    try {
      const resp = await fn(dispatch, ...args)

      return update(ReadyState.Success(resp));
    } catch (err) {

      if (global.RETHROW_ERRORS) {
        throw err;
      }

      return update(ReadyState.Failure(err));
    }

    return;
  }

  func.requestID = requestID;

  return func
}

function makeActionType(label, obj) {
  const T = Type(obj)

  T.prototype.do = function (fn) {
    return makeAsyncActionCreator(this, fn);
  }

  T.prototype.module = label;

  return T;
}


module.exports = {
  ActionRequest,
  ReadyState,
  isUnionTypeRecord,
  makeAsyncActionCreator,
  makeActionType,
}
