"use strict";

global.RETHROW_ERRORS = true;

const test = require('blue-tape')
    , R = require('ramda')
    , makeMockStore = require('../../store_mock')
    , { ReadyState } = require('../../typed-actions/types')
    , actions = require('../actions')
    , reducer = require('../reducer')
    , { Backend, BackendMetadata } = require('../types')
    , { getReadyState, getResponse } = require('../../typed-actions/utils')

test('Listing backends', async t => {
  const store = makeMockStore()

  await store.dispatch(
    actions.listAvailableBackends())

  t.deepEqual(
    getReadyState(store.getActions()[1]),
    ReadyState.Success({
      backends: []
    }),
    'should return an empty array when no backends are present'
  );
})

test('Adding local backends', async t => {
  const store = makeMockStore()

  await store.dispatch(
    actions.addBackend(Backend.UnsavedIndexedDB(), 'test backend', ''));

  const action = store.getActions()[1]
      , timestamp = getResponse(action).metadata.created
      , { id } = getResponse(action).backend

  t.deepEqual(
    getReadyState(action),
    ReadyState.Success({
      backend: Backend.IndexedDB(id),
      metadata: BackendMetadata.BackendMetadataOf({
        label: 'test backend',
        description: '',
        created: timestamp,
        modified: timestamp,
        accessed: timestamp,
      })
    }),
    'should allow adding backends')


  await store.dispatch(
    actions.listAvailableBackends())

  t.equal(4, store.getActions().length);
  t.equal(1, getResponse(store.getActions()[3]).backends.length, 'should list 1 available backend after adding');

});

test('Adding Web backends', async t => {
  const store = makeMockStore()

  await store.dispatch(
    actions.addBackend(
      Backend.Web('http://example.com/'),
      'test backend',
      'Example PeriodO server'))

  const action = store.getActions()[1]
      , timestamp = getResponse(action).metadata.created

    t.deepEqual(
      getReadyState(action),
      ReadyState.Success({
        backend: Backend.Web('http://example.com/'),
        metadata: BackendMetadata.BackendMetadataOf({
          label: 'test backend',
          description: 'Example PeriodO server',
          created: timestamp,
          modified: timestamp,
          accessed: timestamp,
        }),
      }),
      'should allow adding Web backends'
    );

  await store.dispatch(
    actions.listAvailableBackends())

  t.equal(1, getResponse(store.getActions()[3]).backends.length, 'should list 1 available backend after adding');
})


test('Updating backends', async t => {
  const store = makeMockStore()

  store.replaceReducer(reducer);

  await store.dispatch(
    actions.addBackend(
      Backend.UnsavedIndexedDB(),
      'test backend',
      ''
    ))

  const { backend } = getResponse(store.getActions()[1])

  const updatedDataset = {
    type: 'rdf:Bag',
    periodCollections: {
      'collection1': {
        id: 'collection1'
      }
    }
  }

  store.clearActions();

  await store.dispatch(
    actions.updateLocalBackendDataset(backend, updatedDataset))

  t.equal(store.getActions().length, 6);

  t.deepEqual(
    getResponse(store.getActions()[5]).patchData.forward, [
      {
        op: 'add',
        path: '/periodCollections/collection1',
        value: { id: 'collection1' }
      }
    ],
    'Should generate patch data for an updated dataset'
  );

  await store.dispatch(
    actions.deleteBackend(backend))

  store.clearActions();

  await store.dispatch(
    actions.listAvailableBackends())

  t.deepEqual(
    getResponse(R.last(store.getActions())),
    { backends: [] },
    'should list 0 available backends after deleting'
  );
});
