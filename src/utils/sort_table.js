"use strict";

var Tablesort = require('tablesort')
  , naturalSort = require('javascript-natural-sort')


Tablesort.extend('natural', () => true, (a, b) => naturalSort(b, a))

Tablesort.extend('num',
  item => (item || '').match(/-?\d+/),
  (a, b) => parseInt(b) - parseInt(a)
)

module.exports = function (table) {
  return new Tablesort(table);
}
