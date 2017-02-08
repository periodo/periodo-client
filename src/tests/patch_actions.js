"use strict";

const test = require('blue-tape')
    , Immutable = require('immutable')
    , backendActions = require('../actions/backends')
    , patchActions = require('../actions/patches')
    , types = require('../types')
    , makeMockStore = require('./mock_store')



const backendA = {
  name: 'origin',
  type: types.backends.INDEXED_DB,
}

const backendB = {
  name: 'remote',
  type: types.backends.INDEXED_DB,
}

test('Patch generation actions', t => {
  const store = makeMockStore()

  return Promise.resolve()
    .then(() => Promise.all([
      store.dispatch(backendActions.addBackend(backendA)),
      store.dispatch(backendActions.addBackend(backendB)),
    ]))
    .then(() => store.dispatch(
      backendActions.updateBackendDataset(backendA, Immutable.fromJS({
        type: 'rdf:Bag',
        periodCollections: {
          fakeID: {
            id: 'fakeID'
          }
        }
      }))
    ))
    .then(() => store.dispatch(
      patchActions.generateDatasetPatch(backendA, backendB)
    ))
    .then(() => {
      t.deepEqual(store.getActions().pop(), {
        type: types.actions.REQUEST_GENERATE_DATASET_PATCH,
        readyState: types.readyStates.SUCCESS,
        patch: Immutable.fromJS([
          {
            op: 'add',
            path: '/periodCollections/fakeID',
            value: {
              id: 'fakeID'
            }
          }
        ])
      }, 'should patch additions')
    })
    .then(() => store.dispatch(
      patchActions.generateDatasetPatch(backendA, backendB, types.patchDirections.PULL)
    ))
    .then(() => {
      t.deepEqual(store.getActions().pop(), {
        type: types.actions.REQUEST_GENERATE_DATASET_PATCH,
        readyState: types.readyStates.SUCCESS,
        patch: Immutable.fromJS([])
      }, 'should ignore "deletions" of items that simply aren\'t present in both source/origin')
    })
})
