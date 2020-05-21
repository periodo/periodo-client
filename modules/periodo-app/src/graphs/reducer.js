"use strict";

const R = require('ramda')
    , GraphsAction = require('./actions')

const initialState = () => {
  const gazetteers = []
  gazetteers.index = {}
  return { gazetteers }
}

module.exports = function linkedData(state=initialState(), action) {
  if(!Object.prototype.isPrototypeOf.call(GraphsAction.prototype, action.type)) {
    return state
  }

  return action.readyState.case({
    Success: resp => action.type.case({
      FetchGraphs() {
        return state
      },

      FetchGazetteers() {
        return R.assoc('gazetteers', resp.gazetteers, state)
      },
    }),
    _: () => state,
  })
}
