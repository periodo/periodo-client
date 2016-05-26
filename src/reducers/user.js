"use strict";

const { createReducer } = require('redux-immutablejs')

const {
  USER_LOGIN,
  USER_LOGOUT,
} = require('../actions')

module.exports = createReducer(null, {
  [USER_LOGIN]: (state, { user }) => (
    user
  ),

  [USER_LOGOUT]: () => (
    null
  )
})
