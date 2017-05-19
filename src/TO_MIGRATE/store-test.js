"use strict";

const test = require('tape')
    , Immutable = require('immutable')
    , { actions, readyStates } = require('../types')
    , { Backend, RequestedResource } = require('../records')
    , createStore = require('./store')


const emptyState = Immutable.Map({
  backends: Immutable.Map({
    available: new RequestedResource(),
    current: null
  }),

  user: null
});


test('Application store', t => {
  t.plan(3);

  const store1 = createStore()

  t.ok(
    store1.getState().equals(emptyState),
    'Empty store matches empty state'
  );


  const store2 = createStore()

  store2.dispatch({
    type: actions.SET_CURRENT_BACKEND,
    backend: new Backend({ type: 'fake', name: 'a backend' }),
    dataset: 'nothing'
  });

  t.ok(
    store2.getState().equals(
      emptyState.setIn(['backends', 'current'], Immutable.Map({
        backend: new Backend({
          type: 'fake',
          name: 'a backend'
        }),
        dataset: 'nothing'
      }))
    ),
    'Able to set the current backend'
  );


  const store3 = createStore()

  store3.dispatch({
    type: actions.GET_ALL_BACKENDS,
    requestID: 1,
    readyState: readyStates.SUCCESS,
    responseData: Immutable.fromJS({
      backends: [
        new Backend({ type: 'web', name: 'a web backend' }),
      ]
    })
  });

  t.ok(
    store3.getState().equals(
      emptyState
        .setIn(['backends', 'available', 'readyState'], readyStates.SUCCESS)
        .setIn(['backends', 'available', 'requestID'], 1)
        .setIn(['backends', 'available', 'responseData'], Immutable.fromJS({
          backends: [
            new Backend({ type: 'web', name: 'a web backend' })
          ]
        }))
    ), 'Can add loaded backends');
});
