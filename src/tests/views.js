/* global describe, it, before, after */

"use strict";

var assert = require('assert')
  , React = require('react')
  , Immutable = require('immutable')
  , { Simulate } = require('react/addons').addons.TestUtils

if (!window.Promise) {
  window.Promise = require('dexie').Promise;
}

describe('Period form', function () {
  var PeriodForm = require('../components/period_form')
    , container = document.createElement('div')

  function makePeriodFormView() {
    var formEl = document.createElement('div')
      , form

    form = React.createElement(PeriodForm, {
      period: Immutable.fromJS({
        label: 'Progressive era',
        language: 'eng-latn'
      })
    });

    container.appendChild(formEl);
    return React.render(form, formEl);
  }

  makePeriodFormView();

  before(function () { document.body.appendChild(container) });
  after(function () { document.body.removeChild(container) });

  it('Should have bound the label automatically', function () {
    var view = makePeriodFormView()
      , period = view.getPeriodValue()

    assert.deepEqual(view.getPeriodValue().toJS(), {
      type: 'PeriodDefinition',
      label: 'Progressive era',
      language: 'eng-latn',
      localizedLabels: {
        'eng-latn': [ 'Progressive era' ]
      }
    });
  });

  it('Should parse dates for me', function () {
    var view = makePeriodFormView()
      , { startTerminus, stopTerminus } = view.refs.temporalCoverage.refs

    Simulate.change(
      React.findDOMNode(startTerminus).querySelector('[name="label"]'),
      { target: { value: '1890'}});
    Simulate.change(
      React.findDOMNode(stopTerminus).querySelector('[name="label"]'),
      { target: { value: '1920'}});

    assert.deepEqual(view.getPeriodValue().toJS(), {
      label: 'Progressive era',
      language: 'eng-latn',
      localizedLabels: {
        'eng-latn': [ 'Progressive era' ]
      },
      type: 'PeriodDefinition',
      start: { in: { year: '1890' }, label: '1890' },
      stop: { in: { year: '1920' }, label: '1920' }
    });
  });

  it('Should have a null value for empty period termini', function () {
    var view = makePeriodFormView()
      , { startTerminus, stopTerminus } = view.refs.temporalCoverage.refs

    Simulate.change(
      React.findDOMNode(startTerminus).querySelector('[name="label"]'),
      { target: { value: '1890'}});

    Simulate.change(
      React.findDOMNode(startTerminus).querySelector('[name="label"]'),
      { target: { value: ''}});

    assert.equal(view.getPeriodValue().get('start'), null);
  });

  /*
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

  it('Should allow adding alternate labels', function () {
    var view = makePeriodFormView()

    view.$('#js-startLabel').val('1890').trigger('input');
    view.$('#js-endLabel').val('1920').trigger('input');

    view.$('[data-field="alternateLabel"] input').val('the progressive time');
    view.$('[data-field="alternateLabel"] [data-trigger="add-alt-label"]').trigger('click');
    view.$('[data-field="alternateLabel"] input').last().val('the progressive time 2');

    assert.deepEqual(view.getData(), {
      label: 'Progressive era',
      originalLabel: {
        'eng-latn': 'Progressive era'
      },
      alternateLabel: {
        'eng-latn': ['the progressive time', 'the progressive time 2']
      },
      start: { in: { year: '1890' }, label: '1890' },
      stop: { in: { year: '1920' }, label: '1920' },
      type: 'PeriodDefinition'
    });
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
  */
});
