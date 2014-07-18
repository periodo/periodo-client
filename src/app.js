"use strict";

var Backbone = require('./backbone')
  , $ = require('jquery')
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
    if (this._view) this._view.remove();
    this._view = new ViewConstructor(options || {});
    this._view.$el.appendTo('#main');
  },

  index: function () {
    var IndexView = require('./views/index');
    this.changeView(IndexView);
  },

  periodizationList: function () {
    var PeriodizationListView = require('./views/periodization_list');
    this.changeView(PeriodizationListView);
  },
  periodizationAdd: function () {
    var PeriodizationAddView = require('./views/periodization_add');
    this.changeView(PeriodizationAddView);
  },
  periodizationShow: function (periodization) {
    var PeriodizationShowView = require('./views/periodization_show')
      , Periodization = require('./models/periodization')

    this.changeView(PeriodizationShowView);
  },
  periodizationEdit: function (periodization) {
    var PeriodizationEditView = require('./views/periodization_edit');
    this.changeView(PeriodizationEditView);
  }
});
