"use strict";

var $ = require('jquery')
  , Backbone = require('./backbone')
  , $ = require('jquery')
  , Dexie = require('Dexie')
  , root = location.protocol + '//' + location.host
  , ApplicationRouter

var LEFT_CLICK = 1;

$(document).ready(function () {
  var router = new ApplicationRouter();
  Backbone.history.start();
}).on('click a', function (e) {
  if (e.target.href && e.target.href.indexOf(root) === 0 && e.which === LEFT_CLICK) {
    e.preventDefault();
    Backbone.history.navigate(e.target.getAttribute('href'), { trigger: true });
  }
});

ApplicationRouter = Backbone.Router.extend({
  routes: {
    '': 'index',
    'periodizations/': 'periodizationList',
    'periodizations/add/': 'periodizationAdd',
    'periodizations/:periodization/': 'periodizationShow',
    'periodizations/:periodization/edit/': 'periodizationEdit'
  },
  _view: null,
  changeView: function (ViewConstructor, options) {
    Backbone.Relational.store.reset();
    Backbone.Relational.store.addModelScope({});
    if (this._view) this._view.remove();
    this._view = new ViewConstructor(options || {});
    this._view.$el.appendTo('#main');
  },

  index: function () {
    var IndexView = require('./views/index');
    this.changeView(IndexView);
  },

  periodizationAdd: function () {
    var PeriodizationAddView = require('./views/periodization_add');
    this.changeView(PeriodizationAddView);
  },

  periodizationShow: function (periodizationID) {
    var that = this;

    var Periodization = require('./models/periodization');
    var periodization = Periodization.findOrCreate({ id: decodeURIComponent(periodizationID) });
    var PeriodizationView = require('./views/periodization_show')

    periodization.fetch().then(function () {
      var creators = periodization.get('source').fetchRelated('creators', {}, true);
      var contributors = periodization.get('source').fetchRelated('contributors', {}, true);
      return Dexie.Promise.all([].concat(creators, contributors));
    }).then(function () {
      that.changeView(PeriodizationView, { model: periodization });
    });
  }
});
