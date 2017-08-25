"use strict";

const Type = require('union-type')
    , { isUnionTypeRecord } = require('./utils')

const ReadyState = Type({
  Pending: {},
  Success: { response: Object },
  Failure: { error: Error},
})

const ActionRequest = Type({ ActionRequest: {
  type: isUnionTypeRecord,
  requestID: Number,
  readyState: ReadyState,
}})

module.exports = {
  ReadyState,
  ActionRequest,
}
