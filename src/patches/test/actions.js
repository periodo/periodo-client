"use strict";

global.RETHROW_ERRORS = true;

const test = require('blue-tape')
    , R = require('ramda')
    , backendActions = require('../../backends/actions')
    , { BackendStorage } = require('../../backends/types')
    , { ReadyState } = require('../../typed-actions/types')
    , { getResponse, getReadyState } = require('../../typed-actions/utils')
    , patchActions = require('../actions')
    , { PatchDirection } = require('../types')
    , makeMockStore = require('../../store_mock')


test('Patch generation actions', async t => {
  const store = makeMockStore()

  await store.dispatch(
    backendActions.addBackend(
      BackendStorage.IndexedDB(null),
      'origin',
      ''
    ))

  await store.dispatch(
    backendActions.addBackend(
      BackendStorage.IndexedDB(null),
      'remote',
      ''
    ))

  const [ backendA, backendB ] = [
    store.getActions()[1],
    store.getActions()[3],
  ].map(getResponse).map(resp => resp.backend.storage)

  await store.dispatch(
    backendActions.updateLocalDataset(
      backendA,
      {
        type: 'rdf:Bag',
        periodCollections: {
          fakeID: {
            id: 'fakeID'
          }
        }
      }))

  await store.dispatch(
    patchActions.generateDatasetPatch(backendA, backendB))

  t.deepEqual(
    getReadyState(R.last(store.getActions())),
    ReadyState.Success({
      patch: [
        {
          op: 'add',
          path: '/periodCollections/fakeID',
          value: {
            id: 'fakeID'
          }
        }
      ]
    }),
    'should patch additions'
  )

  await store.dispatch(
    patchActions.generateDatasetPatch(
      backendA,
      backendB,
      PatchDirection.Pull()))

  t.deepEqual(
    getReadyState(R.last(store.getActions())),
    ReadyState.Success({
      patch: []
    }),
    'should ignore "deletions" of items that simply aren\'t present in both source/origin'
  )
})
