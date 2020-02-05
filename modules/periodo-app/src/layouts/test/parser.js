"use strict";

const test = require('blue-tape')
    , parse = require('../parser')

// TODO: Whitelist properties for particular layouts? Or not...

test('Parsing specification', async t => {
  const spec = `
  prop1 = foo
  prop2 = bar

  [Block1]
  type = List
  grid-column = 1/2

  [Block2]
  type = Graph
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
        type: 'List',
        gridColumn: '1/2',
      },

      {
        id: 'Block2',
        type: 'Graph',
        gridColumn: '2/3',
        opts: {
          blockProp: 'baz',
        },
      },
    ],
  }, 'should parse a spec string')

  t.deepEqual(parse(`
    []
    type = test
  `), {
    blocks: [
      {
        id: '0',
        type: 'test',
      },
    ],
  }, 'should allow blank block names')

})
