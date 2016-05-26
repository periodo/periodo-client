"use strict";

const test = require('tape')
    , Immutable = require('immutable')
    , actions = require('../actions')
    , { Backend } = require('../records')

function makeEmptyStore() {
  const { createStore } = require('redux')

  return createStore(require('../reducers'));
}


const emptyState = Immutable.Map({
  backends: Immutable.Map({
    available: Immutable.Set(),
    loaded: Immutable.Map(),
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
    backend: new Backend({ type: 'fake', name: 'a backend' })
  });

  t.ok(
    store2.getState().equals(
      emptyState.setIn(['backends', 'current'], new Backend({
        type: 'fake',
        name: 'a backend'
      }))
    ),
    'Able to set the current backend'
  );


  const store3 = makeEmptyStore();

  store3.dispatch({
    type: actions.ADD_LOADED_BACKEND,
    backend: new Backend({ type: 'web', name: 'a web backend' })
  })

  t.ok(
    store3.getState().equals(
      emptyState.updateIn(['backends', 'loaded'], map => map.set(
        Immutable.List(['web', 'a web backend']),
        new Backend({ type: 'web', name: 'a web backend' })
      ))
    ),
    'Can add loaded backends'
  );
});
