"use strict";

const test = require('tape')
    , R = require('ramda')
    , concat = require('concat-stream')
    , fromArray = require('from2-array')
    , parseEngineSpec = require('../state')


const dataset = [
  { name: 'Neolithic', start: -5600, stop: -4001 },
  { name: 'Copper age', start: -4250, stop: -2201, isNamedAfterMetal: true },
  { name: 'Bronze age', start: -2200, stop: -801, isNamedAfterMetal: true },
]

function makeTestEngine() {
  const createReadStream = () => fromArray.obj(dataset)

  const layouts = {
    noop: {
      handler: {}
    },

    callTracker: {
      deriveOpts() {
        return { called: true }
      },
      handler: {}
    },

    datasetFilterer: {
      filterItems(data) {
        return data.isNamedAfterMetal
      },
      handler: {}
    }
  }

  return spec => parseEngineSpec(layouts, createReadStream, spec);
}

test('Layout options', t => {
  t.plan(4);

  const firstDerivedOpts = R.path(['groups', 0, 'layouts', 0, 'derivedOpts'])

  const parseSpec = makeTestEngine()

  t.deepEqual(
    firstDerivedOpts(parseSpec({
      groups: [
        {
          layouts: [
            { name: 'noop' }
          ]
        }
      ]
    })),
    {},
    'should default to passing an empty opts object')

  t.deepEqual(
    firstDerivedOpts(parseSpec({
      groups: [
        {
          layouts: [
            {
              name: 'noop',
              opts: {
                foo: 'bar'
              }
            }
          ]
        }
      ]
    })),
    { foo: 'bar' },
    'should pass through opts as derivedOpts without a deriveOpts function')

  t.deepEqual(
    firstDerivedOpts(parseSpec({
      groups: [
        {
          layouts: [
            { name: 'callTracker' }
          ]
        }
      ]
    })),

    { called: true },

    'should call deriveOpts() function on layout handler')

  t.deepEqual(
    (parsed => [
      parsed.groups[0].props,
      parsed.groups[0].layouts[0].props,
    ])(parseSpec({
      groups: [
        {
          props: { a: 1 },
          layouts: [
            {
              name: 'noop',
              props: { b: 2 }
            }
          ]
        }
      ]
    })),

    [
      { a: 1 },
      { b: 2 }
    ],

    'should pass through props to groups and layouts')


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

test('Data streaming through engine state', async t => {
  t.plan(5);

  const parseSpec = makeTestEngine()

  {
    const { streams } = parseSpec({ groups: [] })

    t.equal(
      streams.length,
      1,
      'should have one stream with an empty spec')

    streams[0].pipe(concat(items => {
      t.deepEqual(
        items,
        dataset,
        'should pipe through all items from the initial stream')
    }))
  }

  {
    const { streams } = parseSpec({
      groups: [
        {
          layouts: [
            { name: 'datasetFilterer' }
          ]
        }
      ]
    })

    t.equal(
      streams.length,
      2,
      'should always have one more total streams than total groups')

    streams[1].pipe(concat(items => {
      t.equal(
        items.length,
        2,
        'should filter items based on `filterItems` layout method')
    }))
  }

  {
    const { streams } = parseEngineSpec({}, () => fromArray.obj([1, 2, 3]), { groups: [] })

    streams[0].pipe(concat(items => {
      t.equal(
        items.length,
        3,
        'should allow passing a function to create a read stream')
    }))
  }
})

/*
test('sorts', t => {
  const state = makeEngineState()

  {
    const streams = state.getDataStreams([], {
      sort: 'name',
    })

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

})
*/
