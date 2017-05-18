"use strict";

const Type = require('union-type')
    , { ActionRequest, ReadyState } = require('./types')

let _requestID = 0;

function makeAsyncActionCreator(type, fn) {
  const requestID = _requestID++

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


module.exports = makeActionType;
