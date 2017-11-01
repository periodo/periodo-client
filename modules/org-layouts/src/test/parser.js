"use strict";

const test = require('blue-tape')
    , R = require('ramda')
    , parse = require('../parser')

// TODO: Whitelist properties for particular layouts? Or not...

test('Parsing specification', async t => {
  const spec = `
  prop1 = foo
  prop2 = bar

  [Block1]
  name = List
  grid-column = 1/2

  [Block2]
  name = Graph
  grid-column = 2/3
  block-prop = baz
  `

  t.deepEqual(parse(spec), {
    opts: {
      prop1: 'foo',
      prop2: 'bar',
    },
    blocks: [
      {
        id: 'Block1',
        name: 'List',
        gridColumn: '1/2',
      },

      {
        id: 'Block2',
        name: 'Graph',
        gridColumn: '2/3',
        opts: {
          blockProp: 'baz',
        }
      },
    ]
  }, 'should parse a spec string')

  t.deepEqual(parse(`
    []
    name = test
  `), {
    blocks: [
      {
        id: '0',
        name: 'test',
      }
    ]
  }, 'should allow blank block names')

})
