"use strict";

const test = require('blue-tape')
    , thunk = require('redux-thunk').default
    , actions = require('../actions/backends')
    , Immutable = require('immutable')
    , configureMockStore = require('redux-mock-store')
    , types = require('../types')
    , { Backend } = require('../records')
    , mockStorage = require('./mock_storage')()


const mockStore = configureMockStore([
  thunk.withExtraArgument({ db: require('../db')(mockStorage) })
])

const store = mockStore();


test('Periodo DB', t => {
  return Promise.resolve()
    .then(() =>
      store.dispatch(
        actions.listAvailableBackends()
      ).then(() => {
        t.equal(store.getActions().length, 2);

        t.ok(Immutable.is(
          Immutable.fromJS(store.getActions().shift()),
          Immutable.fromJS({
            type: types.actions.REQUEST_AVAILABLE_BACKENDS,
            readyState: types.readyStates.PENDING,
          })
        ));

        t.ok(Immutable.is(
          Immutable.fromJS(store.getActions().shift()),
          Immutable.fromJS({
            type: types.actions.REQUEST_AVAILABLE_BACKENDS,
            readyState: types.readyStates.SUCCESS,
            backends: Immutable.List()
          })
        ), 'should return an empty List when no backends are present');
      })
    )
    .then(() =>
      store.dispatch(
        actions.addBackend(
          'test backend',
          types.backends.INDEXED_DB
        )
      ).then(() => {
        const timestamp = store.getActions()[0].payload.getIn(['backend', 'created'])

        t.ok(timestamp, 'should automatically set a timestamp when adding a new backend')

        const expectedPayload = Immutable.fromJS({
          backend: new Backend({
            name: 'test backend',
            type: types.backends.INDEXED_DB,
            created: timestamp,
            modified: timestamp,
            accessed: timestamp,
          }),

          dataset: {
            type: 'rdf:Bag',
            periodCollections: {}
          }
        });

        t.ok(Immutable.is(
          Immutable.fromJS(store.getActions()),
          Immutable.fromJS([
            {
              type: types.actions.REQUEST_ADD_BACKEND,
              readyState: types.readyStates.PENDING,
              payload: expectedPayload
            },
            {
              type: types.actions.REQUEST_ADD_BACKEND,
              readyState: types.readyStates.SUCCESS,
              payload: expectedPayload
            }
          ])
        ), 'should allow adding backends')

        store.clearActions();
      })
    )
    .then(() =>
      store.dispatch(
        actions.addBackend(
          'test backend',
          types.backends.INDEXED_DB
        )
      ).then(() => {
        const lastAction = store.getActions().pop();

        t.equal(lastAction.readyState, types.readyStates.FAILURE);
        t.equal(lastAction.error.name, 'ConstraintError',
            'Should throw a Dexie ConstraintError when adding multiple backends with the same type+name')

        store.clearActions();
      })
    ).then(() =>
      store.dispatch(
        actions.listAvailableBackends()
      ).then(() => {
        t.equal(2, store.getActions().length);
        t.equal(1, store.getActions()[1].backends.size, 'should list 1 available backend after adding');

        store.clearActions();
      })
    )
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
        actions.updateBackendDataset(
          'test backend',
          types.backends.INDEXED_DB,
          updatedDataset
        )
      ).then(() => {
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
    }).then(() =>
      store.dispatch(
        actions.deleteBackend(
          'test backend',
          types.backends.INDEXED_DB
        )
      )
    )
    .then(() =>
      store.dispatch(
        actions.listAvailableBackends()
      ).then(() => {
        const dispatchedActions = store.getActions()

        t.equal(dispatchedActions[dispatchedActions.length - 1].backends.size, 0,
            'should list 0 available backends after deleting');
      })
    )
});
