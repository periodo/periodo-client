"use strict";

const R = require('ramda')
    , Type = require('union-type')
    , { $$TypedRequest } = require('./symbols')
    , { isUnionTypeRecord } = require('./utils')

const ReadyState = Type({
  Pending: {},
  Success: { response: Object },
  Failure: { error: Error},
})

const ActionRequest = Type({ ActionRequest: {
  type: isUnionTypeRecord,
  readyState: ReadyState,
}})

function makeTypedAction(namespace, obj) {
  const requestTypeDef = {}
      , responseTypeDef = {}
      , execs = {}

  Object.entries(obj).forEach(([name, { request, response, exec }]) => {
    if (!request) {
      throw new Error(`Action \`${namespace}.${name}\` has not declared a request type.`)
    }

    if (!response) {
      throw new Error(`Action \`${namespace}.${name}\` has not declared a response type.`)
    }

    requestTypeDef[name] = request;
    responseTypeDef[name + 'Response'] = response;
    execs[name] = exec
  })

  const RequestType = Type(requestTypeDef)
      , ResponseType = Type(responseTypeDef)

  RequestType.prototype.responseOf = function (obj) {
    const resp = ResponseType[this._name + 'ResponseOf'](obj)
        , extraKeys = R.difference(Object.keys(obj), resp._keys)

    if (extraKeys.length) {
      throw new Error(`Extra keys in ${namespace}.${resp._name}: ${extraKeys.join(', ')}`)
    }

    return resp
  }

  RequestType.prototype.exec = function (...args) {
    return execs[this._name](...args)
  }

  RequestType.prototype.toString = function() {
    return `${namespace}.${this._name}`
  }

  RequestType.prototype[$$TypedRequest] = true
  RequestType.namespace = namespace;

  return RequestType;
}


module.exports = {
  ReadyState,
  ActionRequest,
  makeTypedAction,
}
