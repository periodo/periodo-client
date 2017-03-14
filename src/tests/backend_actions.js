"use strict";

global.RETHROW_ERRORS = true;

const test = require('blue-tape')
    , actions = require('../actions/backends')
    , types = require('../types')
    , makeMockStore = require('./mock_store')

let resp

test('Adding IDB backends', async t => {
  const store = makeMockStore()

  resp = await store.dispatch(
    actions.listAvailableBackends())

  {
    const { requestID } = resp

    t.equal(store.getActions()[1], resp, 'action should return success response');

    t.deepEqual(
      store.getActions(),
      [
        {
          requestID,
          type: types.actions.GET_ALL_BACKENDS,
          readyState: types.readyStates.PENDING,
        },
        {
          requestID,
          type: types.actions.GET_ALL_BACKENDS,
          readyState: types.readyStates.SUCCESS,
          responseData: {
            backends: []
          }
        }
      ],
      'should return an empty array when no backends are present'
    );
  }

  store.clearActions();

  resp = await store.dispatch(
    actions.addBackend({
      type: types.backends.INDEXED_DB,
      label: 'test backend',
    }))

  {
    const { requestID } = resp
        , timestamp = store.getActions()[1].responseData.backend.created
        , id = store.getActions()[1].responseData.backend.id

    t.ok(timestamp, 'should automatically set a timestamp when adding a new backend')

    t.deepEqual(
      store.getActions(),
      [
        {
          requestID,
          type: types.actions.CREATE_BACKEND,
          readyState: types.readyStates.PENDING,
          payload: {
            type: types.backends.INDEXED_DB,
            label: 'test backend',
            description: '',
          }
        },
        {
          requestID,
          type: types.actions.CREATE_BACKEND,
          readyState: types.readyStates.SUCCESS,
          responseData: {
            backend: {
              id,
              type: types.backends.INDEXED_DB,
              label: 'test backend',
              description: '',
              created: timestamp,
              modified: timestamp,
              accessed: timestamp,

              dataset: {
                type: 'rdf:Bag',
                periodCollections: {}
              }
            }
          }
        }
      ]
    , 'should allow adding backends')
  }



  await store.dispatch(
    actions.listAvailableBackends())

  {
    // Two for adding, two for listing
    t.equal(4, store.getActions().length);
    t.equal(1, store.getActions()[3].responseData.backends.length, 'should list 1 available backend after adding');
  }

});


test('Adding Web backends', async t => {
  const store = makeMockStore()

  const resp = await store.dispatch(
    actions.addBackend({
      label: 'test backend',
      description: 'Example PeriodO server',
      type: types.backends.WEB,
      url: 'http://example.com/'
    }))

  {
    const { requestID } = store.getActions()[0]
        , { id } = store.getActions()[1].responseData.backend
        , timestamp = resp.responseData.backend.created

    t.deepEqual(
      store.getActions(),
      [
        {
          requestID,
          type: types.actions.CREATE_BACKEND,
          readyState: types.readyStates.PENDING,
          payload: {
            label: 'test backend',
            description: 'Example PeriodO server',
            type: types.backends.WEB,
            url: 'http://example.com/'
          }
        },
        {
          requestID,
          type: types.actions.CREATE_BACKEND,
          readyState: types.readyStates.SUCCESS,
          responseData: {
            backend: {
              type: types.backends.WEB,
              label: 'test backend',
              description: 'Example PeriodO server',
              url: 'http://example.com/',
              created: timestamp,
              modified: timestamp,
              accessed: timestamp,
              dataset: null
            }
          },
        }
      ], 'should allow adding Web backends')
  }

  await store.dispatch(
    actions.listAvailableBackends())

  {
    // Two for adding, two for listing
    t.equal(4, store.getActions().length);
    t.equal(1, store.getActions()[3].responseData.backends.length, 'should list 1 available backend after adding');
  }

  await store.dispatch(
    actions.addBackend({
      name: 'test backend2',
      type: types.backends.WEB,
    }))

  {
    const last = store.getActions().pop()

    t.equals(last.readyState, types.readyStates.FAILURE,
        'should fail to add a Web backend without a URL')
  }
})

test('Updating backends', async t => {
  const store = makeMockStore()

  resp = await store.dispatch(
    actions.addBackend({
      name: 'test backend',
      type: types.backends.INDEXED_DB
    }))

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

    await store.dispatch(
      actions.updateLocalBackendDataset({
        id: resp.responseData.backend.id,
        updatedDataset
      }))
  }

  {
    const lastAction = store.getActions().slice(3)[0]

    t.equal(lastAction.readyState, types.readyStates.SUCCESS,
        'should successfully update editable datasets');

    t.deepEqual(lastAction.responseData.patchData.forward, [
      {
        op: 'add',
        path: '/periodCollections/collection1',
        value: { id: 'collection1' }
      }
    ], 'Should generate patch data for an updated dataset');
  }

  await store.dispatch(
    actions.deleteBackend({
      id: resp.responseData.backend.id,
      type: types.backends.INDEXED_DB
    }))

  await store.dispatch(
    actions.listAvailableBackends())

  {
    const dispatchedActions = store.getActions()

    t.equal(dispatchedActions[dispatchedActions.length - 1].responseData.backends.length, 0,
        'should list 0 available backends after deleting');
  }
});
