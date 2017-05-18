"use strict";

global.RETHROW_ERRORS = true;

const test = require('blue-tape')
    , makeMockStore = require('../../shared/mock_store')
    , { ReadyState } = require('../../typed-actions/types')
    , actions = require('../actions')
    , { Backend, BackendAction, BackendMetadata } = require('../types')

test('Listing backends', async t => {
  const store = makeMockStore()

  const action = actions.listAvailableBackends()
      , resp = await store.dispatch(action)

  t.deepEqual(
    store.getActions()[1],
    resp,
    'should return success response as final dispatched action')

  t.deepEqual(
    store.getActions(),
    [
      {
        requestID: action.requestID,
        type: 'GetAllBackends',
        readyState: ReadyState.Pending(),
      },
      {
        requestID: action.requestID,
        type: 'GetAllBackends',
        readyState: ReadyState.Success({
          backends: []
        })
      }
    ],
    'should return an empty array when no backends are present'
  );
})

test('Adding local backends', async t => {
  const store = makeMockStore()

  {
    const action = actions.addBackend(Backend.UnsavedIndexedDB(), 'test backend', '')
        , resp = await store.dispatch(action);

    const { response } = resp.readyState
        , timestamp = response.metadata.created
        , id = response.backend.id

    t.ok(timestamp, 'should automatically set a timestamp when adding a new backend')

    t.deepEqual(
      store.getActions()[0][Symbol.for('Type')], BackendAction.CreateBackend(
      Backend.UnsavedIndexedDB(), 'test backend', ''),
      'Should include the union-type representation of the action in the Type symbol'
    );

    t.deepEqual(
      store.getActions(),
      [
        {
          type: 'CreateBackend',
          requestID: action.requestID,
          readyState: ReadyState.Pending(),
        },
        {
          type: 'CreateBackend',
          requestID: action.requestID,
          readyState: ReadyState.Success({
            backend: Backend.IndexedDB(id),
            metadata: BackendMetadata.BackendMetadataOf({
              label: 'test backend',
              description: '',
              created: timestamp,
              modified: timestamp,
              accessed: timestamp,
            })
          })
        }
      ]
    , 'should allow adding backends')
  }



  await store.dispatch(
    actions.listAvailableBackends())

  {
    // Two for adding, two for listing
    t.equal(4, store.getActions().length);
    t.equal(1, store.getActions()[3].readyState.response.backends.length, 'should list 1 available backend after adding');
  }

});

test('Adding Web backends', async t => {
  const store = makeMockStore()


  {
    const action = actions.addBackend(
      Backend.Web('http://example.com/'),
      'test backend',
      'Example PeriodO server'
    )

    const resp = await store.dispatch(action);

    const { requestID } = action
        , timestamp = resp.readyState.response.metadata.created


    t.deepEqual(
      store.getActions(),
      [
        {
          requestID,
          type: 'CreateBackend',
          readyState: ReadyState.Pending(),
        },
        {
          requestID,
          type: 'CreateBackend',
          readyState: ReadyState.Success({
            backend: Backend.Web('http://example.com/'),
            metadata: BackendMetadata.BackendMetadataOf({
              label: 'test backend',
              description: 'Example PeriodO server',
              created: timestamp,
              modified: timestamp,
              accessed: timestamp,
            }),
          }),
        }
      ], 'should allow adding Web backends')
  }

  await store.dispatch(
    actions.listAvailableBackends())

  {
    // Two for adding, two for listing
    t.equal(4, store.getActions().length);
    t.equal(1, store.getActions()[3].readyState.response.backends.length, 'should list 1 available backend after adding');
  }
})


test('Updating backends', async t => {
  const store = makeMockStore()

  await store.dispatch(
    actions.addBackend(
      Backend.UnsavedIndexedDB(),
      'test backend',
      ''
    ))

  const resp = await store.dispatch(actions.listAvailableBackends())
      , backend = resp.readyState.response.backends[0].type

  {
    const updatedDataset = {
      type: 'rdf:Bag',
      periodCollections: {
        'collection1': {
          id: 'collection1'
        }
      }
    }

    store.clearActions();

    await store.dispatch(actions.updateLocalBackendDataset(backend, updatedDataset))
  }

  {
    const lastAction = store.getActions().slice(3)[0]

    t.equal(lastAction.readyState._name, 'Success',
        'should successfully update editable datasets');

    t.deepEqual(lastAction.readyState.response.patchData.forward, [
      {
        op: 'add',
        path: '/periodCollections/collection1',
        value: { id: 'collection1' }
      }
    ], 'Should generate patch data for an updated dataset');
  }

  await store.dispatch(actions.deleteBackend(backend))

  await store.dispatch(actions.listAvailableBackends())

  {
    const dispatchedActions = store.getActions()

    t.equal(dispatchedActions[dispatchedActions.length - 1].readyState.response.backends.length, 0,
        'should list 0 available backends after deleting');
  }
});
