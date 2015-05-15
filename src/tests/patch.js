"use strict";

var assert = require('assert')
  , Immutable = require('immutable')

describe('Patch workflow', function () {
  var initialData = Immutable.fromJS(require('./data/period-collection.json'))
    , path = ['periodCollections', 'p03377f', 'definitions', 'p03377fkhrv', 'editorialNote']
    , updatedData

  updatedData = initialData.setIn(path, 'This is an editorial note.');

  it('should format patches', function () {
    var { formatPatch, patchTypes } = require('../utils/patch')
      , patch = formatPatch(initialData.toJS(), updatedData.toJS(), '')

    assert.deepEqual(
      patch.forward,
      [ { op: 'add', path: '/' + path.join('/'), value: 'This is an editorial note.' } ]);

    assert.deepEqual(
      patch.backward,
      [ { op: 'remove', path: '/' + path.join('/') } ]);

    assert.deepEqual(patch.forwardHashes, ['dcb4af6ca8ac2bd84e61fea381d9fff5']);
    assert.deepEqual(patch.backwardHashes, ['3fea72233374c67d98f6208e823480aa']);
    assert.deepEqual(patch.affectedCollections, ['p03377f'])
    assert.deepEqual(patch.affectedPeriods, ['p03377fkhrv'])

    assert.deepEqual(
      patch.message,
      'Changed editorialNote of period p03377fkhrv in collection p03377f.');

    // assert.deepEqual(patch.type, patchTypes.EDIT_PERIOD);
  });

});
