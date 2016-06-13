"use strict";

const test = require('blue-tape')
    , thunk = require('redux-thunk').default
    , actions = require('../actions/backends')
    , Immutable = require('immutable')
    , configureMockStore = require('redux-mock-store')
    , types = require('../types')
    , { Backend } = require('../records')


const mocks = require('./mock_storage')()

const mockStore = configureMockStore([
  thunk.withExtraArgument({ db: require('../db')(mocks) })
])

const store = mockStore(/* ROOT REDUCER() */);


test('Periodo DB', t =>
  store.dispatch(actions.listAvailableBackends())
    .then(() => {
      t.ok(Immutable.is(
        Immutable.fromJS(store.getActions()),
        Immutable.fromJS([
          {
            type: types.actions.REQUEST_AVAILABLE_BACKENDS,
            readyState: types.readyStates.PENDING,
          },
          {
            type: types.actions.REQUEST_AVAILABLE_BACKENDS,
            readyState: types.readyStates.SUCCESS,
            backends: Immutable.List()
          }
        ])
      ), 'should return an empty List when no backends are present');

      store.clearActions();
    })
    .then(() =>
      store.dispatch(actions.addBackend({
        name: 'test backend',
        type: types.backends.INDEXED_DB
      }))
    )
    .then(() => {
      const requestAction = store.getActions()[0]
      const timestamp = requestAction.payload.get('backend').created

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
    .then(() =>
      store.dispatch(actions.listAvailableBackends())
    )
    .then(() => {
      t.equal(1, store.getActions()[1].backends.size, 'should list 1 available backend after adding')
    })
);
