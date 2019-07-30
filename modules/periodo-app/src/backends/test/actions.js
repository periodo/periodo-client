"use strict";

global.RETHROW_ERRORS = true;

const test = require('blue-tape')
    , R = require('ramda')
    , makeMockStore = require('../../store_mock')
    , { ReadyState, getResponse } = require('org-async-actions')
    , BackendAction = require('../actions')
    , reducer = require('../reducer')
    , { Backend, BackendMetadata, BackendStorage } = require('../types')

test('Listing backends', async t => {
  const store = makeMockStore()

  const action = BackendAction.GetAllBackends

  await store.dispatch(action)

  t.deepEqual(
    store.getActions()[1],
    {
      type: action,
      readyState: ReadyState.Success(action.responseOf({
        backends: [],
      })),
    },
    'should return an empty array when no backends are present'
  );
})

test('Adding local backends', async t => {
  const store = makeMockStore()

  const actionType = BackendAction.CreateBackend(
    BackendStorage.IndexedDB(null),
    'test backend',
    ''
  )

  await store.dispatch(actionType)

  const action = store.getActions()[1]
      , timestamp = getResponse(action).backend.metadata.created
      , { id } = getResponse(action).backend.storage

  t.deepEqual(action, {
    type: actionType,
    readyState: ReadyState.Success(actionType.responseOf({
      backend: Backend.BackendOf({
        storage: BackendStorage.IndexedDB(id),
        metadata: BackendMetadata.BackendMetadataOf({
          label: 'test backend',
          description: '',
          created: timestamp,
          modified: timestamp,
          accessed: timestamp,
        }),
      }),
    })),
  }, 'should allow adding backends')

  await store.dispatch(BackendAction.GetAllBackends)

  t.equal(4, store.getActions().length);
  t.equal(1, getResponse(store.getActions()[3]).backends.length, 'should list 1 available backend after adding');

});

test('Adding Web backends', async t => {
  const store = makeMockStore()

  const actionType = BackendAction.CreateBackend(
      BackendStorage.Web('http://example.com/'),
      'test backend',
      'Example PeriodO server'
  )

  await store.dispatch(actionType)

  const action = store.getActions()[1]
      , timestamp = getResponse(action).backend.metadata.created

    t.deepEqual(action, {
      type: actionType,
      readyState: ReadyState.Success(actionType.responseOf({
        backend: Backend.BackendOf({
          storage: BackendStorage.Web('http://example.com/'),
          metadata: BackendMetadata.BackendMetadataOf({
            label: 'test backend',
            description: 'Example PeriodO server',
            created: timestamp,
            modified: timestamp,
            accessed: timestamp,
          }),
        }),
      })),
    }, 'should allow adding Web backends')

  await store.dispatch(BackendAction.GetAllBackends)

  t.equal(1, getResponse(store.getActions()[3]).backends.length, 'should list 1 available backend after adding');
})

test('Updating backends', async t => {
  const store = makeMockStore()

  store.replaceReducer(reducer);

  const actionType = BackendAction.CreateBackend(
    BackendStorage.IndexedDB(null),
    'test backend',
    ''
  )

  await store.dispatch(actionType)

  const { backend } = getResponse(store.getActions()[1])

  const updatedRawDataset = {
    type: 'rdf:Bag',
    authorities: {
      'authority1': {
        id: 'authority1',
      },
    },
  }

  store.clearActions();

  await store.dispatch(BackendAction.UpdateLocalDataset(
    backend.storage,
    updatedRawDataset,
    '',
  ))

  t.equal(store.getActions().length, 6);

  t.deepEqual(
    getResponse(store.getActions()[5]).patchData.forward, [
      {
        op: 'add',
        path: '/authorities/authority1',
        value: { id: 'authority1' },
      },
    ],
    'Should generate patch data for an updated dataset'
  );

  await store.dispatch(BackendAction.DeleteBackend(backend.storage))

  store.clearActions();

  const actionType2 = BackendAction.GetAllBackends

  await store.dispatch(actionType2)

  t.deepEqual(
    getResponse(R.last(store.getActions())),
    actionType2.responseOf({ backends: [] }),
    'should list 0 available backends after deleting'
  );
});
