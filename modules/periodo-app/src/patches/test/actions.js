"use strict";

global.RETHROW_ERRORS = true;

const test = require('blue-tape')
    , R = require('ramda')
    , BackendAction = require('../../backends/actions')
    , MainAction = require('../../main/actions')
    , { BackendStorage } = require('../../backends/types')
    , { ReadyState, getResponse } = require('org-async-actions')
    , PatchAction = require('../actions')
    , { PatchDirection } = require('../types')
    , makeMockStore = require('../../store_mock')
    , DatasetProxy = require('../../backends/dataset_proxy')


test('Patch generation actions', async t => {
  const store = makeMockStore()

  await store.dispatch(MainAction.InitIndexedDB)

  store.clearActions()

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

  const newRawDataset = {
    type: 'rdf:Bag',
    authorities: {
      'http://localhost/.well-known/genid/fakeID': {
        id: 'http://localhost/.well-known/genid/fakeID',
      },
    },
  }

  const emptyRawDataset = {
    type: 'rdf:Bag',
    authorities: {},
  }

  await store.dispatch(
    BackendAction.UpdateLocalDataset(backendA, newRawDataset, ''))

  const action1 = PatchAction.GeneratePatch(
    backendA,
    backendB,
    PatchDirection.Push)

  await store.dispatch(action1)

  t.deepEqual(R.last(store.getActions()), {
    type: action1,
    readyState: ReadyState.Success(action1.responseOf({
      patch: [
        {
          op: 'add',
          path: '/authorities/http:~1~1localhost~1.well-known~1genid~1fakeID',
          value: {
            id: 'http://localhost/.well-known/genid/fakeID',
          },
        },
      ],
      localDataset: new DatasetProxy(newRawDataset),
      remoteDataset: new DatasetProxy(emptyRawDataset),
    })),
  }, 'should patch additions')

  const action2 = PatchAction.GeneratePatch(
    backendA,
    backendB,
    PatchDirection.Pull)

  await store.dispatch(action2)

  t.deepEqual(R.last(store.getActions()), {
    type: action2,
    readyState: ReadyState.Success(action2.responseOf({
      patch: [],
      localDataset: new DatasetProxy(newRawDataset),
      remoteDataset: new DatasetProxy(emptyRawDataset),
    })),
  }, 'should ignore "deletions" of items with skolem IDs')

  store.clearActions()

  const webBackend = BackendStorage.Web('http://example.com')

  const action3 = PatchAction.ReplaceIdentifiers(
    backendA,
    webBackend,
    {
      'http://localhost/.well-known/genid/fakeID':
      'http://localhost/.well-known/genid/newID',
    })

  await store.dispatch(action3)

  t.deepEqual(R.last(store.getActions()), {
    type: action3,
    readyState: ReadyState.Success(action3.responseOf({
      dataset: new DatasetProxy({
        type: 'rdf:Bag',
        authorities: {
          'http://localhost/.well-known/genid/newID': {
            id: 'http://localhost/.well-known/genid/newID',
          },
        },
      }),
    })),
  }, 'should allow replacing identifiers')
})
