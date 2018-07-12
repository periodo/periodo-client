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

function makeTypedAction(obj) {
  const requestTypeDef = {}
      , responseTypeDef = {}
      , execs = {}

  Object.entries(obj).forEach(([name, { request, response, exec }]) => {
    if (!request) {
      throw new Error(`Action \`${name}\` has not declared a request type.`)
    }

    if (!response) {
      throw new Error(`Action \`${name}\` has not declared a response type.`)
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
      throw new Error(`Extra keys in response for action \`${this._name}\`: ${extraKeys.join(', ')}`)
    }

    return resp
  }

  RequestType.prototype.exec = function (...args) {
    return execs[this._name](...args)
  }

  RequestType.prototype.toString = function() {
    return `${this._name}`
  }

  RequestType.prototype[$$TypedRequest] = true

  if (process.env.NODE_ENV !== 'production') {
    return new Proxy(RequestType, {
      get(obj, prop) {
        const ctor = obj[prop]

        if (!ctor) {
          throw new Error(`No such action: \`${prop}\``)
        }

        if (typeof ctor === 'function' && !prop.endsWith('Of')) {
          return new Proxy(ctor, {
            apply(target, _this, args) {
              if (target.length !== args.length) {
                throw new Error(`Wrong number of arguments passed to action \`${prop}\``)
              }

              return target.apply(_this, args)
            }
          })
        }

        return ctor
      },
    })
  }

  return RequestType;
}


module.exports = {
  ReadyState,
  ActionRequest,
  makeTypedAction,
}
