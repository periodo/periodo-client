"use strict";

const test = require('blue-tape')
    , actions = require('../actions/backends')
    , Immutable = require('immutable')
    , types = require('../types')
    , { Backend } = require('../records')
    , makeMockStore = require('./mock_store')


test('Adding IDB backends', async t => {
  const store = makeMockStore()

  await store.dispatch(
    actions.listAvailableBackends())

  {
    t.equal(store.getActions().length, 2);
    t.equal(store.getActions()[0].requestID, store.getActions()[1].requestID);

    t.ok(Immutable.is(
      Immutable.fromJS(store.getActions().shift()).delete('requestID'),
      Immutable.fromJS({
        type: types.actions.GET_ALL_BACKENDS,
        readyState: types.readyStates.PENDING,
      })
    ));

    t.ok(Immutable.is(
      Immutable.fromJS(store.getActions().shift()).delete('requestID'),
      Immutable.fromJS({
        type: types.actions.GET_ALL_BACKENDS,
        readyState: types.readyStates.SUCCESS,
        responseData: {
          backends: []
        }
      })
    ), 'should return an empty List when no backends are present');
  }

  await store.dispatch(
    actions.addBackend({
      name: 'test backend',
      type: types.backends.INDEXED_DB
    }))

  {
    const timestamp = store.getActions()[0].payload.getIn(['backend', 'created'])

    t.ok(timestamp, 'should automatically set a timestamp when adding a new backend')

    const expectedPayload = Immutable.fromJS({
      backend: new Backend({
        name: 'test backend',
        type: types.backends.INDEXED_DB,
        url: null,
        created: timestamp,
        modified: timestamp,
        accessed: timestamp,
      }).toMap().delete('id'),

      dataset: {
        type: 'rdf:Bag',
        periodCollections: {}
      }
    });

    t.ok(Immutable.is(
      Immutable.fromJS(store.getActions()).map(action => action.delete('requestID')),
      Immutable.fromJS([
        {
          type: types.actions.CREATE_BACKEND,
          readyState: types.readyStates.PENDING,
          payload: expectedPayload
        },
        {
          type: types.actions.CREATE_BACKEND,
          readyState: types.readyStates.SUCCESS,
          payload: expectedPayload
        }
      ])
    ), 'should allow adding backends')
  }


  await store.dispatch(
    actions.listAvailableBackends())

  {
    // Two for adding, two for listing
    t.equal(4, store.getActions().length);
    t.equal(1, store.getActions()[3].responseData.backends.size, 'should list 1 available backend after adding');
  }

  await store.dispatch(
    actions.addBackend({
      name: 'test backend',
      type: types.backends.INDEXED_DB
    })
  )

  {
    const lastAction = store.getActions().pop();

    t.equal(lastAction.readyState, types.readyStates.FAILURE);
    t.equal(lastAction.error.name, 'ConstraintError',
      'Should throw a Dexie ConstraintError when adding multiple backends with the same type+name')
  }
})


test('Adding Web backends', t => {
  const store = makeMockStore()

  return Promise.resolve()
    .then(() => store.dispatch(
      actions.addBackend({
        name: 'test backend',
        type: types.backends.WEB,
        url: 'http://example.com/'
      })
    ))
    .then(() => {
      const timestamp = store.getActions()[0].payload.getIn(['backend', 'created'])

      const expectedPayload = Immutable.fromJS({
        backend: new Backend({
          name: 'test backend',
          type: types.backends.WEB,
          url: 'http://example.com/',
          created: timestamp,
          modified: timestamp,
          accessed: timestamp,
        }).toMap().delete('id'),

        dataset: null
      });

      t.ok(Immutable.is(
        Immutable.fromJS(store.getActions()).map(action => action.delete('requestID')),
        Immutable.fromJS([
          {
            type: types.actions.CREATE_BACKEND,
            readyState: types.readyStates.PENDING,
            payload: expectedPayload
          },
          {
            type: types.actions.CREATE_BACKEND,
            readyState: types.readyStates.SUCCESS,
            payload: expectedPayload
          }
        ])
      ), 'should allow adding Web backends')
    })
    .then(() => store.dispatch(
      actions.listAvailableBackends()
    ))
    .then(() => {
      // Two for adding, two for listing
      t.equal(4, store.getActions().length);
      t.equal(1, store.getActions()[3].responseData.backends.size, 'should list 1 available backend after adding');

    })
    .then(() => store.dispatch(
      actions.addBackend({
        name: 'test backend2',
        type: types.backends.WEB,
      })
    ))
    .then(() => {
      const last = store.getActions().pop()

      t.equals(last.readyState, types.readyStates.FAILURE,
          'should fail to add a Web backend without a URL')
    })
})

test('Updating backends', t => {
  const store = makeMockStore()

  return Promise.resolve()
    .then(() => store.dispatch(
      actions.addBackend({
        name: 'test backend',
        type: types.backends.INDEXED_DB
      })
    ))
    .then(() => {
      const updatedDataset = Immutable.fromJS({
        type: 'rdf:Bag',
        periodCollections: {
          'collection1': {
            id: 'collection1'
          }
        }
      })

      return store.dispatch(
        actions.updateBackendDataset({
          name: 'test backend',
          type: types.backends.INDEXED_DB,
        }, updatedDataset)
      )
    })
    .then(() => {
      const lastAction = store.getActions().pop();

      t.equal(lastAction.readyState, types.readyStates.SUCCESS,
          'should successfully update editable datasets');

      t.deepEqual(lastAction.responseData.patchData.forward, [
        {
          op: 'add',
          path: '/periodCollections/collection1',
          value: { id: 'collection1' }
        }
      ], 'Should generate patch data for an updated dataset');
    })
    .then(() => store.dispatch(
      actions.deleteBackend({
        name: 'test backend',
        type: types.backends.INDEXED_DB
      })
    ))
    .then(() => store.dispatch(
      actions.listAvailableBackends()
    ))
    .then(() => {
      const dispatchedActions = store.getActions()

      t.equal(dispatchedActions[dispatchedActions.length - 1].responseData.backends.size, 0,
          'should list 0 available backends after deleting');
    })
});
