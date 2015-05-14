/* global describe, it, before, after */

"use strict";

var assert = require('assert')

describe('Application', function () {
  var container = document.createElement('div')
    , application

  before(function () {
    var main = document.createElement('div')
      , spinner = document.createElement('div')
      , currentBackend = document.createElement('div')

    main.setAttribute('id', 'main');
    spinner.setAttribute('id', 'spinner');
    currentBackend.setAttribute('id', 'current-backend');

    container.appendChild(main);
    container.appendChild(spinner);
    container.appendChild(currentBackend);

    document.body.appendChild(container);

    application = require('../app');
  });

  after(function () { document.body.removeChild(container) });

  it('Should display a not found error for non-existent collections', function () {
    return application.periodCollectionShow('__memory__', 'fake').then(function (view) {
      assert.equal(view.$('p').html(), 'No period collection in __memory__ with ID fake.');
    });
  });

  it('Should display a not found error for non-existent collections', function () {
    return application.backendHome('__memory__').then(function (view) {
      assert.equal(document.getElementById('current-backend').textContent.trim(),
        'Current backend: __memory__ [switch]')
    });
  });

  it('Should create a new skolem ID automatically for new collections', function () {
    return application.periodCollectionEdit('__memory__').then(function (view) {
      var id = view.state.cursor.get('id');
      assert(id);
      assert(id.indexOf('.well-known/genid/') !== -1)
    });
  });

});
