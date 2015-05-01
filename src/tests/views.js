"use strict";

var assert = require('assert')
  , dom = require('dom-sandbox')

describe('Period form', function () {
  var PeriodFormView = require('../views/period_edit')
    , Period = require('../models/period')
    , container = dom('<div></div>')
    , period
    , view

  function makeView() {
    var period = new Period({ label: 'Progressive era' });
    var el = document.createElement('div');
    container.appendChild(el);
    var view = new PeriodFormView({ model: period, el: el });
    return view;
  }

  after(function () { dom.destroy() });

  it ('Should have bound the label automatically', function () {
    var view = makeView();
    assert.equal(view.$('[data-field="label"]').val(), 'Progressive era');
    assert.equal(view.$('[data-field="label-language"]').text(), 'eng-latn');
  });

  it('Should parse dates for me', function () {
    var view = makeView();
    view.$('#js-startLabel').val('1890').trigger('input');
    view.$('#js-endLabel').val('1920').trigger('input');
    assert.deepEqual(view.model.toJSON(), {
      label: 'Progressive era',
      originalLabel: {
        'eng-latn': 'Progressive era'
      },
      type: 'PeriodDefinition',
      start: { in: { year: '1890' }, label: '1890' },
      stop: { in: { year: '1920' }, label: '1920' }
    });
  });

  it ('Should render errors', function () {
    var view = makeView();

    view.model.isValid();
    assert.equal(view.$('.error-message').length, 1);
    assert.equal(view.$('.error-message').text(), 'A period must have start and stop dates.');

    view.$('#js-startLabel').val('1920').trigger('input');
    view.$('#js-endLabel').val('1890').trigger('input');
    view.model.isValid();
    assert.equal(view.$('.error-message').length, 1);
    assert.equal(view.$('.error-message').text(), 'A period\'s stop must come after its start.');

    view.$('.error-message').remove();
    view.$('#js-startLabel').val('1890').trigger('input');
    view.$('#js-endLabel').val('1920').trigger('input');
    view.model.isValid();
    assert.equal(view.$('.error-message').length, 0);
  });
});
