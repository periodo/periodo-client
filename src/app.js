"use strict";

var $ = require('jquery')
  , Backbone = require('./backbone')
  , Spinner = require('spin.js')
  , root = location.protocol + '//' + location.host
  , ApplicationRouter

var LEFT_CLICK = 1;

function wasLeftClick(e) {
  return e.which === LEFT_CLICK &&
    !e.shiftKey &&
    !e.ctrlKey &&
    !e.altKey
}

$(document).ready(function () {
  var router = new ApplicationRouter();
  var spinner = new Spinner({
    lines: 12,
    length: 5,
    width: 2,
    radius: 6,
    trail: 40 
  });
  var spinnerEl = document.getElementById('spinner')

  router.on('request', spinner.spin.bind(spinner, spinnerEl));
  router.on('sync error', function () {
    setTimeout(spinner.stop.bind(spinner), 100);
  })

  Backbone._app = router;
  Backbone.history.start();
}).on('click a', function (e) {
  if (e.target.href && e.target.href.indexOf(root) === 0 && wasLeftClick(e)) {
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
    'periodizations/:periodization/edit/': 'periodizationEdit',
    'sync/': 'sync',
    'admin/': 'admin'
  },
  _view: null,
  changeView: function (ViewConstructor, options) {
    if (this._view) this._view.remove();
    this._view = new ViewConstructor(options || {});
    this._view.$el.appendTo('#main');
  },

  index: function () {
    var that = this;
    var IndexView = require('./views/index');

    var PeriodizationCollection = require('./collections/periodization');
    var periodizations = new PeriodizationCollection();
    periodizations.fetch().then(function () {
      that.changeView(IndexView, { collection: periodizations });
    });
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
      that.changeView(PeriodizationView, { model: periodization });
    });
  },

  sync: function () {
    var SyncView = require('./views/sync');
    this.changeView(SyncView);
  },

  admin: function () {
    var AdminView = require('./views/admin');
    this.changeView(AdminView);
  }
});
