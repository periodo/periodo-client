"use strict";

const test = require('tape')
    , { Value, Change } = require('../src/types')
    , { findChanges } = require('../src/Diff')

test('findChanges', t => {
  t.plan(11)

  t.deepEqual(
    findChanges([ Value.Anonymous(1) ], [ Value.Anonymous(2) ]),
    [ Change.Deletion(1), Change.Addition(2)]
  )
  t.deepEqual(
    findChanges([ Value.Anonymous('a') ], [ Value.Anonymous('a') ]),
    [ Change.Preservation('a') ]
  )
  t.deepEqual(
    findChanges(
      [ Value.Identified({id:5, a:1}) ], [ Value.Identified({id:6, a:2}) ]
    ),
    [ Change.Deletion({id:5, a:1}), Change.Addition({id:6, a:2}) ]
  )
  t.deepEqual(
    findChanges(
      [ Value.Identified({id:5, a:1}) ], [ Value.Identified({id:5, a:1}) ]
    ),
    [ Change.Preservation({id:5, a:1}) ]
  )
  t.deepEqual(
    findChanges(
      [ Value.Identified({id:5, a:1}) ], [ Value.Identified({id:5, a:2}) ]
    ),
    [ Change.Mutation({id:5, a:1}, {id:5, a:2}) ]
  )
  t.deepEqual(
    findChanges(
      [ Value.Anonymous('a'), Value.Identified({id:5}) ],
      [ Value.Identified({id:5, a:1}), Value.Anonymous('b') ],
    ),
    [ Change.Deletion('a')
    , Change.Mutation({id:5}, {id:5, a:1})
    , Change.Addition('b')
    ]
  )
  t.deepEqual(
    findChanges(
      [ Value.Anonymous('a') ],
      [ Value.Anonymous('a'), Value.Anonymous('a') ],
    ),
    [ Change.Preservation('a'), Change.Addition('a') ]
  )
  t.deepEqual(
    findChanges(
      [ Value.Anonymous('a'), Value.Anonymous('a') ],
      [ Value.Anonymous('a') ],
    ),
    [ Change.Preservation('a'), Change.Deletion('a') ]
  )
  t.deepEqual(
    findChanges(
      [ Value.Anonymous('a'), Value.Anonymous('a') ],
      [],
    ),
    [ Change.Deletion('a'), Change.Deletion('a') ]
  )
  t.deepEqual(
    findChanges(
      [ Value.Identified({id: 1}) ],
      [ Value.Identified({id: 1})
      , Value.Identified({id: 1, a: 1, b: 1})
      , Value.Identified({id: 1, a: 2})
      ],
    ),
    [ Change.Mutation({id: 1}, {id: 1, a: 2, b: 1}) ]
  )
  t.deepEqual(
    findChanges(
      [ Value.Identified({id: 1})
      , Value.Identified({id: 1, a: 1, b: 1})
      , Value.Identified({id: 1, a: 2})
      ],
      [ Value.Identified({id: 1}) ],
    ),
    [ Change.Mutation({id: 1, a: 2, b: 1}, {id: 1}) ]
  )
})
