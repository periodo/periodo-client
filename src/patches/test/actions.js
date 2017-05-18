"use strict";

global.RETHROW_ERRORS = true;

const test = require('blue-tape')
    , Immutable = require('immutable')
    , backendActions = require('../../backends/actions')
    , { Backend } = require('../../backends/types')
    , { ReadyState } = require('../../typed-actions/types')
    , patchActions = require('../actions')
    , { PatchAction, PatchDirection } = require('../types')
    , makeMockStore = require('../../shared/mock_store')


test('Patch generation actions', async t => {
  const store = makeMockStore()

  const resps = await Promise.all([
    store.dispatch(backendActions.addBackend(
      Backend.UnsavedIndexedDB(),
      'origin',
      ''
    )),
    store.dispatch(backendActions.addBackend(
      Backend.UnsavedIndexedDB(),
      'remote',
      ''
    ))
  ])

  const [ backendA, backendB ] = resps.map(resp => resp.readyState.response.backend)

  await store.dispatch(
    backendActions.updateLocalBackendDataset(
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

  {
    const action = store.getActions().pop()

    delete action.requestID;

    t.deepEqual(action, {
      type: 'GenerateDatasetPatch',
      readyState: ReadyState.Success({
        patch: Immutable.fromJS([
          {
            op: 'add',
            path: '/periodCollections/fakeID',
            value: {
              id: 'fakeID'
            }
          }
        ])
      })
    }, 'should patch additions')
  }

  await store.dispatch(
    patchActions.generateDatasetPatch(backendA, backendB, PatchDirection.Pull()))

  {
    const action = store.getActions().pop()

    delete action.requestID

    t.deepEqual(action, {
      type: 'GenerateDatasetPatch',
      readyState: ReadyState.Success({
        patch: Immutable.fromJS([])
      })
    }, 'should ignore "deletions" of items that simply aren\'t present in both source/origin')
  }
})
