"use strict";

const R = require('ramda')
    , Type = require('union-type')
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

      try {
        type.validateResponse(resp);
      } catch (e) {
        console.error(
          `ERROR: Invalid response given to success condition for action ${type._name}`);
        throw e;
      }

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

module.exports = function makeActionType(label, obj) {
  const reqs = {}
      , resps = {}

  Object.keys(obj).forEach(key => {
    const val = obj[key]

    if (!Array.isArray(val) || val.length !== 2) {
      throw new Error(
        'Each new action must define two types as an array. The first is ' +
        'the request type, the second the response type.'
      )
    }

    const [req, resp] = val

    reqs[key] = req;
    resps[key + 'Response'] = resp;
  })

  const RequestType = Type(reqs)
      , ResponseType = Type(resps)

  RequestType.prototype.do = function (fn) {
    return makeAsyncActionCreator(this, fn);
  }

  RequestType.prototype.validateResponse = function (obj) {
    const resp = ResponseType[this._name + 'ResponseOf'](obj)
        , extraKeys = R.difference(Object.keys(obj), resp._keys)

    if (extraKeys.length) {
      throw new Error(`Extra keys in ${label}.${resp._name}: ${extraKeys.join(', ')}`)
    }
  }

  RequestType.prototype.module = label;

  return RequestType;
}
