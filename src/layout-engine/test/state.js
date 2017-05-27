"use strict";

const test = require('tape')
    , R = require('ramda')
    , through = require('through2')
    , concat = require('concat-stream')
    , EngineState = require('../state')
    , example = require('./example_engine')

function makeEngineState() {
  return new EngineState(example.dataset, example.layouts, example.accessors)
}

test('Group processor', t => {
  t.plan(3);

  const state = makeEngineState()

  t.deepEqual(
    state.groupPropsFromSpec([
      {
        layouts: [
          { name: 'noop' }
        ]
      }
    ]),

    [
      [ undefined, {} ]
    ])

  t.deepEqual(
    state.groupPropsFromSpec([
      {
        layouts: [
          { name: 'noop', opts: { foo: 'bar' } }
        ]
      }
    ]),

    [
      [ { foo: 'bar' }, { foo: 'bar' } ]
    ],
    'should pass through opts as derivedOpts without a deriveOpts function')

  t.deepEqual(
    state.groupPropsFromSpec([
      {
        layouts: [
          { name: 'callTracker' }
        ]
      }
    ]),

    [
      [ undefined, { called: true } ]
    ],
    'should call deriveOpts() function on layout handler')

  /*
  t.deepEqual(
    state.groupPropsFromSpec([
      {
        layouts: [
          { name: 'callTracker' }
        ]
      }
    ], [ [undefined, { test: 1 }] ]),
    [
      [ undefined, { test: 1 } ]
    ],
    'should not call deriveOpts() if opts have not been changed since previous processing outcome')
  */
});

function periodGetter() {
  return through.obj(function (getRecord, enc, cb) {
    this.push(getRecord('period'));
    cb();
  })
}

test('Data streaming through engine state', async t => {
  t.plan(9);

  const state = makeEngineState()

  {
    const streams = state.getDataStreams([])

    t.equal(streams.length, 1)

    streams[0]
      .pipe(through.obj(function (getRecord, enc, cb) {
        this.push(getRecord('period'));
        cb();
      }))
      .pipe(concat(items => {
        t.deepEqual(items, example.dataset);
      }))
  }

  {
    const streams = state.getDataStreams([
      {
        layouts: [
          { name: 'datasetFilterer' }
        ]
      }
    ])

    t.equal(streams.length, 2)

    streams[1]
      .pipe(periodGetter())
      .pipe(concat(items => {
        t.equal(items.length, 2, 'should filter items based on `filterItems` layout method')
      }))

  }

  {
    const { layoutProps } = state.getLayoutProps([
      {
        layouts: [
          { name: 'noop' },
          { name: 'noop' },
        ]
      }
    ])

    t.equal(layoutProps.length, 1);
    t.equal(layoutProps[0].length, 2, 'should create passthrough streams for each layout in a group');

    let d1, d2

    await new Promise(resolve => {
      layoutProps[0][0].stream
        .pipe(periodGetter())
        .pipe(concat(data => {
          d1 = data;
          resolve();
        }))
    })

    await new Promise(resolve => {
      layoutProps[0][1].stream
        .pipe(periodGetter())
        .pipe(concat(data => {
          d2 = data;
          resolve();
        }))
    })

    t.notEqual(d1, d2, 'lists of items should not be strictly equal');
    t.ok(R.equals(d1, d2), '...but should be deep equal');
    t.equal(d1[0], d2[0], '...and have strictly equal elements');
  }
})
