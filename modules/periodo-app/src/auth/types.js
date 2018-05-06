"use strict";

const Type = require('union-type')
    , makeActionType = require('../typed-actions/make_type')
    , { isDataset } = require('periodo-utils/src/dataset')
    , { isURL } = require('periodo-utils/src/misc')

const AuthAction = makeActionType('auth', {
  GetAllSettings: [
    {},
    {
      settings: Object,
    }
  ],

  UpdateSettings: [
    {
      fn: Function,
    },
    {
      settings: Object,
    }
  ]
})

module.exports = {
  AuthAction,
}
