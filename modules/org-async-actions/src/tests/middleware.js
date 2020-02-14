"use strict";

const test = require('blue-tape')
    , configureMockStore = require('redux-mock-store').default
    , { typedAsyncActionMiddleware, makeTypedAction } = require('../')
    , { ReadyState } = require('../types')

test('middleware', async t => {
  const Actions = makeTypedAction('ns', {
    GetSomething: {
      request: {},
      response: {
        something: Number,
      },
      exec: () => ({
        something: 1,
      }),
    },
  })

  const store = configureMockStore([
    typedAsyncActionMiddleware(),
  ])()

  await store.dispatch(Actions.GetSomething)

  const action = Actions.GetSomething

  t.deepEqual(store.getActions(), [
    {
      type: action,
      readyState: ReadyState.Pending,
    },
    {
      type: Actions.GetSomething,
      readyState: ReadyState.Success(action.responseOf({
        something: 1,
      })),
    },
  ])

  t.ok(1)
})
