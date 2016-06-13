"use strict";

const test = require('tape')
    , Immutable = require('immutable')
    , { actions, readyStates } = require('../types')
    , { Backend, RequestedResource } = require('../records')

function makeEmptyStore() {
  const { createStore } = require('redux')

  return createStore(require('../reducers'));
}


const emptyState = Immutable.Map({
  backends: Immutable.Map({
    available: new RequestedResource(),
    current: null
  }),

  user: null
});


test('Application store', t => {
  t.plan(3);

  const store1 = makeEmptyStore();

  t.ok(
    store1.getState().equals(emptyState),
    'Empty store matches empty state'
  );


  const store2 = makeEmptyStore();

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


  const store3 = makeEmptyStore();

  store3.dispatch({
    type: actions.REQUEST_AVAILABLE_BACKENDS,
    readyState: readyStates.SUCCESS,
    responseData: Immutable.fromJS({
      backends: [
        new Backend({ type: 'web', name: 'a web backend' }),
      ]
    })
  })


  t.ok(
    store3.getState().equals(
      emptyState
        .setIn(['backends', 'available', 'readyState'], readyStates.SUCCESS)
        .setIn(['backends', 'available', 'responseData'], Immutable.fromJS({
          backends: [
            new Backend({ type: 'web', name: 'a web backend' })
          ]
        }))
    ), 'Can add loaded backends');
});
