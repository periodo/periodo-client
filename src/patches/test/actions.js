"use strict";

global.RETHROW_ERRORS = true;

const test = require('blue-tape')
    , Immutable = require('immutable')
    , backendActions = require('../actions/backends')
    , patchActions = require('../actions/patches')
    , types = require('../types')
    , makeMockStore = require('./mock_store')



const backendAData = {
  label: 'origin',
  type: types.backends.INDEXED_DB,
}

const backendBData = {
  label: 'remote',
  type: types.backends.INDEXED_DB,
}

test('Patch generation actions', async t => {
  const store = makeMockStore()

  const resps = await Promise.all([
    store.dispatch(backendActions.addBackend(backendAData)),
    store.dispatch(backendActions.addBackend(backendBData)),
  ])

  const [ backendA, backendB ] = resps.map(resp => resp.responseData.backend)

  await store.dispatch(
    backendActions.updateLocalBackendDataset(Object.assign({}, backendA, {
      updatedDataset: {
        type: 'rdf:Bag',
        periodCollections: {
          fakeID: {
            id: 'fakeID'
          }
        }
      }
    })))

  await store.dispatch(
    patchActions.generateDatasetPatch(backendA, backendB))

  {
    const action = store.getActions().pop()

    delete action.requestID;

    t.deepEqual(action, {
      type: types.actions.GENERATE_DATASET_PATCH,
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
  }

  await store.dispatch(
    patchActions.generateDatasetPatch(backendA, backendB, types.patchDirections.PULL))

  {
    const action = store.getActions().pop()

    delete action.requestID

    t.deepEqual(action, {
      type: types.actions.GENERATE_DATASET_PATCH,
      readyState: types.readyStates.SUCCESS,
      patch: Immutable.fromJS([])
    }, 'should ignore "deletions" of items that simply aren\'t present in both source/origin')
  }
})
