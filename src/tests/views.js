"use strict";

var assert = require('assert')
  , Immutable = require('immutable')

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
      model: Immutable.fromJS({ label: 'Progressive era' }),
      store: Immutable.fromJS({}),
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

  it ('Should render errors', function () {
    var view = makePeriodFormView();

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
