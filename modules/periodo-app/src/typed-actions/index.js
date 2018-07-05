"use strict";

const types = require('./types')
    , utils = require('./utils')

module.exports = {
  typedAsyncActionMiddleware: require('./middleware'),
  makeTypedAction: types.makeTypedAction,
  getResponse: utils.getResponse,
  getError: utils.getError,
  handleCompletedAction: utils.handleCompletedAction,
}
