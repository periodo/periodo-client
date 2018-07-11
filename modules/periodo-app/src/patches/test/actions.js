"use strict";

global.RETHROW_ERRORS = true;

const test = require('blue-tape')
    , R = require('ramda')
    , BackendAction = require('../../backends/actions')
    , { BackendStorage } = require('../../backends/types')
    , { ReadyState } = require('../../typed-actions/types')
    , { getResponse } = require('../../typed-actions/utils')
    , PatchAction = require('../actions')
    , { PatchDirection } = require('../types')
    , makeMockStore = require('../../store_mock')


test('Patch generation actions', async t => {
  const store = makeMockStore()

  await store.dispatch(
    BackendAction.CreateBackend(
      BackendStorage.IndexedDB(null),
      'origin',
      ''
    ))

  await store.dispatch(
    BackendAction.CreateBackend(
      BackendStorage.IndexedDB(null),
      'remote',
      ''
    ))

  const [ backendA, backendB ] = [
    store.getActions()[1],
    store.getActions()[3],
  ].map(getResponse).map(resp => resp.backend.storage)

  const newData = {
    type: 'rdf:Bag',
    authorities: {
      fakeID: {
        id: 'fakeID'
      }
    }
  }

  const emptyData = {
    type: 'rdf:Bag',
    authorities: {}
  }

  await store.dispatch(
    BackendAction.UpdateLocalDataset(backendA, newData, ''))

  const action1 = PatchAction.GenerateDatasetPatch(backendA, backendB, PatchDirection.Push)

  await store.dispatch(action1)

  t.deepEqual(R.last(store.getActions()), {
    type: action1,
    readyState: ReadyState.Success(action1.responseOf({
      patch: [
        {
          op: 'add',
          path: '/authorities/fakeID',
          value: {
            id: 'fakeID'
          }
        },
      ],
      localDataset: newData,
      remoteDataset: emptyData,
    }))
  }, 'should patch additions')

  const action2 = PatchAction.GenerateDatasetPatch(
    backendA,
    backendB,
    PatchDirection.Pull)

  await store.dispatch(action2)

  t.deepEqual(R.last(store.getActions()), {
    type: action2,
    readyState: ReadyState.Success(action2.responseOf({
      patch: [],
      localDataset: newData,
      remoteDataset: emptyData,
    })),
  }, 'should ignore "deletions" of items that simply aren\'t present in both source/origin')
})
