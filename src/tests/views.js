/* global describe, it, before, after */

"use strict";

var assert = require('assert')
  , Immutable = require('immutable')
  , Cursor = require('immutable/contrib/cursor')

if (!window.Promise) {
  window.Promise = require('dexie').Promise;
}

function appendDiv(container) {
  var el = document.createElement('div');
  container.appendChild(el);
  return el;
}

describe('Period form', function () {
  var PeriodFormView = require('../views/period_edit')
    , container = document.createElement('div')

  function makePeriodFormView() {
    return new PeriodFormView({
      cursor: Cursor.from(Immutable.fromJS({ data: { label: 'Progressive era' }}), ['data']),
      spatialCoverages: Immutable.fromJS([]),
      el: appendDiv(container)
    });
  }

  before(function () { document.body.appendChild(container) });
  after(function () { document.body.removeChild(container) });

  it ('Should have bound the label automatically', function () {
    var view = makePeriodFormView();
    assert.equal(view.$('[data-field="label"]').val().trim(), 'Progressive era');
    assert.equal(view.$('[data-field="originalLabel"] [data-field="label-language"]').text().trim(), 'eng-latn');
  });

  it('Should parse dates for me', function () {
    var view = makePeriodFormView();
    view.$('#js-startLabel').val('1890').trigger('input');
    view.$('#js-endLabel').val('1920').trigger('input');
    assert.deepEqual(view.getData(), {
      label: 'Progressive era',
      originalLabel: {
        'eng-latn': 'Progressive era'
      },
      type: 'PeriodDefinition',
      start: { in: { year: '1890' }, label: '1890' },
      stop: { in: { year: '1920' }, label: '1920' }
    });
  });

  it('Should render errors', function () {
    var view = makePeriodFormView();

    view.validate();
    assert.equal(view.$('.error-message').length, 1);
    assert.equal(view.$('.error-message').text(), 'A period must have start and stop dates.');

    view.$('#js-startLabel').val('1920').trigger('input');
    view.$('#js-endLabel').val('1890').trigger('input');
    view.validate();
    assert.equal(view.$('.error-message').length, 1);
    assert.equal(view.$('.error-message').text(), 'A period\'s stop must come after its start.');

    view.$('#js-startLabel').val('1890').trigger('input');
    view.$('#js-endLabel').val('1920').trigger('input');
    view.validate();
    assert.equal(view.$('.error-message').length, 0);
  });

  it('Should save its state only when asked', function () {
    var view = makePeriodFormView();

    view.$('#js-startLabel').val('1890').trigger('input');
    view.$('#js-endLabel').val('1920').trigger('input');

    assert.deepEqual(view.cursor.deref().toJS(), { label: 'Progressive era' });

    view.savePeriod();

    assert.deepEqual(view.cursor.deref().toJS(), {
      label: 'Progressive era',
      originalLabel: {
        'eng-latn': 'Progressive era'
      },
      start: { in: { year: '1890' }, label: '1890' },
      stop: { in: { year: '1920' }, label: '1920' },
      type: 'PeriodDefinition'
    });
  });

  it('Should empty its cursor when deleted', function () {
    var view = makePeriodFormView();
    view.deletePeriod();
    assert.equal(view.cursor.deref(), undefined);
  });
});

describe('Period collection edit view', function () {
  var PeriodCollectionEditView = require('../views/period_collection_edit')
    , container = document.createElement('div')
    , fakeBackend = { name: '', path: '' }
    , states = {}

  states.empty = { data: Immutable.fromJS({ periodCollections: {} }) }
  states.empty.cursor = Cursor.from(states.empty.data, ['periodCollections', 'newID']);

  function makeFormView(opts) {
    return new PeriodCollectionEditView({
      state: opts.state,
      backend: opts.backend,
      el: appendDiv(container)
    });
  }

  before(function () { document.body.appendChild(container) });
  after(function () { document.body.removeChild(container) });

  it('should render a form for new collection', function () {
    var view = makeFormView({ state: states.empty, backend: fakeBackend })

    assert.equal(view.$('h1').text(), 'Add period collection');

    assert(!view.$('#ld-source-select').hasClass('hide'));
    assert(view.$('#no-ld-source-select').hasClass('hide'));

    view.$('.toggle-form-type').trigger('click');

    assert(view.$('#ld-source-select').hasClass('hide'));
    assert(!view.$('#no-ld-source-select').hasClass('hide'));

    assert.deepEqual(view.getData().toJS(), {
      type: 'PeriodCollection',
      definitions: {}
    });
  });

  it('Should render errors for a missing or empty source', function () {
    var view = makeFormView({ state: states.empty, backend: fakeBackend })

    view.validate();
    assert.equal(view.$('.error-message').length, 1);
    assert.equal(view.$('.error-message').text(), 'A source is required for a period collection.');

    view.$('.toggle-form-type').trigger('click');

    view.$('[data-field="yearPublished"]').val('2015');
    view.validate();
    assert.equal(view.$('.error-message').length, 1);
    assert.equal(view.$('.error-message').text(),
      'Non linked data sources must have a citation or title.')

    view.$('[data-field="citation"]').val('a citation');
    view.validate();
    assert.equal(view.$('.error-message').length, 0);

    assert.deepEqual(view.getData().toJS(), {
      type: 'PeriodCollection',
      definitions: {},
      source: {
        citation: 'a citation',
        yearPublished: '2015'
      }
    });
  });

  it('Should call save with an updated period collection', function (done) {
    var backend = { name: '', path: '' }
      , view
      , state

    state = { data: Immutable.fromJS({ periodCollections: { emma: { id: 'emma' }}}) };
    state.cursor = Cursor.from(
      state.data,
      ['periodCollections', 'emma'],
      updated => state.data = updated);

    view = makeFormView({ state, backend })

    backend.saveStore = function (data) {
      assert.deepEqual(data.toJS(), {
        periodCollections: {
          emma: {
            id: 'emma',
            definitions: {},
            type: 'PeriodCollection',
            source: { 
              yearPublished: '1934',
              citation: 'Living My Life',
              creators: [
                { name: 'Emma Goldman' }
              ]
            }
          }
        }
      });
      done();
      return Promise.resolve(null);
    }

    view.$('.toggle-form-type').trigger('click');
    view.$('[data-field="yearPublished"]').val('1934');
    view.$('[data-field="citation"]').val('Living My Life');
    view.$('[data-field="creators"] input').val('Emma Goldman');

    return view.handleSave();
  });
});
