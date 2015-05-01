"use strict";

var $ = require('jquery')
  , Backbone = require('./backbone')
  , Spinner = require('spin.js')
  , root = location.protocol + '//' + location.host
  , ApplicationRouter
  , app

var LEFT_CLICK = 1;

if (!global.Promise) {
  global.Promise = require('dexie').Promise;
}

function handleError(err) {
  console.error(err.stack || err);
}

function wasLeftClick(e) {
  return e.which === LEFT_CLICK &&
    !e.shiftKey &&
    !e.ctrlKey &&
    !e.altKey
}

function checkAuth() {
  var $signin = $('#auth-signin-link')
    , $signout = $('#auth-signout-link')

  if ('auth' in localStorage) {
    $signin.addClass('hide');

    $signout
      .removeClass('hide')
      .find('span').text(JSON.parse(localStorage.auth).name);
  } else {
    $signin.removeClass('hide');
    $signout.addClass('hide');
  }
}

function refreshBackend(backend) {
  Backbone._app.currentBackend = backend;
  $('#current-backend').html('Current backend: ' + backend.name + ' [<a href="#p/">switch</a>]');
  $('#periodo-logo').attr('href', '#p/' + backend.name + '/');
}

function initVersion() {
  var version = require('../package.json').version;
  version = 'v' + version;
  $('#version-number').html(`
      PeriodO client
      <a href="https://github.com/periodo/periodo-client/tree/${version}">
      ${version}
      </a>
  `);
}

$(document).ready(function () {
  initVersion();
  var spinner = new Spinner({
    lines: 12,
    length: 5,
    width: 2,
    radius: 6,
    trail: 40 
  });
  var spinnerEl = document.getElementById('spinner')

  app.on('request', spinner.spin.bind(spinner, spinnerEl));
  app.on('sync error requestEnd', function () {
    setTimeout(spinner.stop.bind(spinner), 100);
  })

  app.on('backendSwitch', refreshBackend);

  app.initErrorList();

  checkAuth();

  Backbone.history.start();
}).on('click a', function (e) {
  var goodClick
    , skip

  goodClick = (
    e.target.href &&
    e.target.href.indexOf(root) === 0 &&
    wasLeftClick(e)
  )

  skip = e.target.dataset.noRedirect;

  if (skip) {
    e.preventDefault();
  } else if (goodClick) {
    e.preventDefault();
    Backbone.history.navigate(e.target.getAttribute('href'), { trigger: true });
  }
});

ApplicationRouter = Backbone.Router.extend({
  routes: {
    '': 'welcome',
    'p/': 'backendSelect',
    'p/:backend/': 'backendHome',
    'p/:backend/periodCollections/': 'periodCollectionList',
    'p/:backend/periodCollections/add/': 'periodCollectionAdd',
    'p/:backend/periodCollections/:periodCollection/': 'periodCollectionShow',
    'p/:backend/periodCollections/:periodCollection/edit/': 'periodCollectionEdit',
    'p/:backend/sync/': 'sync',
    'p/:backend/patches/submit/': 'submitPatch',
    'p/:backend/patches/': 'submittedPatches',
    'signin/': 'signin',
    'signout/': 'signout',
    '*anything': 'attemptRedirect'
  },
  _view: null,
  changeView: function (ViewConstructor, options) {
    if (this._view) this._view.remove();
    this._view = new ViewConstructor(options || {});
    this._view.$el.appendTo('#main');
  },
  initErrorList: function () {
    var Dexie = require('dexie')
      , Error = Backbone.Model.extend({})
      , ErrorCollection = Backbone.Collection.extend({ model: Error })
      , ErrorView = require('./views/errors')

    this.errorCollection = new ErrorCollection();
    this.errorView = new ErrorView({
      collection: this.errorCollection,
      el: $('#error-list')
    });

    Dexie.Promise.on('error', err => this.addError(err));
  },
  addError: function (err) {
    this.errorCollection.add({
      error: err,
      time: new Date()
    });
  },

  welcome: function () {
    var backend;

    if (localStorage.currentBackend) {
      backend = localStorage.currentBackend;
      Backbone.history.navigate('p/' + backend + '/', { trigger: true, replace: true });
    } else {
      Backbone.history.navigate('p/', { trigger: true, replace: true });
    }
  },

  backendSelect: function () {
    var BackendSelectView = require('./views/backend_select');
    this.changeView(BackendSelectView);
  },

  backendHome: function (backend) {
    var that = this;
    var IndexView = require('./views/index');
    var getMasterCollection = require('./master_collection');

    getMasterCollection(backend).then(function (masterCollection) {
      that.changeView(IndexView, { collection: masterCollection });
    }).catch(handleError);

  },

  periodCollectionAdd: function (backend) {
    var PeriodizationAddView = require('./views/period_collection_add');
    var getMasterCollection = require('./master_collection');
    var that = this;
    getMasterCollection(backend).then(function (masterCollection) {
      that.changeView(PeriodizationAddView);
    }).catch(handleError);
  },

  periodCollectionShow: function (backend, periodCollectionID) {
    var that = this;
    var getMasterCollection = require('./master_collection');

    var Periodization = require('./models/period_collection');
    //var periodCollection = Periodization.create({ id: decodeURIComponent(periodCollectionID) });
    var PeriodizationView = require('./views/period_collection_show')

    getMasterCollection(backend).then(function () {
      var periodCollection = Periodization.all().get({
        id: decodeURIComponent(periodCollectionID)
      });
      that.changeView(PeriodizationView, { model: periodCollection });
    }).catch(handleError);
  },

  periodCollectionEdit: function (backend, periodCollectionID) {
    var that = this;
    var Periodization = require('./models/period_collection');
    var PeriodizationEditView = require('./views/period_collection_add');
    var getMasterCollection = require('./master_collection');
    getMasterCollection(backend).then(function () {
      var periodCollection = Periodization.all().get({
        id: decodeURIComponent(periodCollectionID)
      });
      that.changeView(PeriodizationEditView, { model: periodCollection });
    }).catch(handleError);
  },

  sync: function (backend) {
    var db = require('./db');
    var that = this;
    var getMasterCollection = require('./master_collection');


    getMasterCollection(backend).then(function () {
      db(backend).getLocalData().then(function (localData) {
        var SyncView = require('./views/sync');
        that.changeView(SyncView, { localData: localData });
      });
    }).catch(handleError);
  },

  signin: function () {
    var SignInView = require('./views/signin');
    this.changeView(SignInView, { authCallback: checkAuth });
  },

  signout: function () {
    var SignOutView = require('./views/signout');
    this.changeView(SignOutView, { authCallback: checkAuth });
  },

  submitPatch: function (backend) {
    var db = require('./db')
      , getMasterCollection = require('./master_collection')

    getMasterCollection(backend)
      .then(() => db(backend).getLocalData())
      .then(localData => this.changeView(
        require('./views/submit_patch'), { localData }
      ));
  },

  submittedPatches: function (backend) {
    var db = require('./db')

    db(backend).localPatches.toArray(localPatches => {
      this.changeView(require('./views/local_patches'), { localPatches });
    });
  },

  // FIXME: This should not actually switch the backend, but rather check if
  // the thing being linked to actually exists before redirection
  attemptRedirect: function (key) {
    var getMasterCollection = require('./master_collection')
      , Periodization = require('./models/period_collection')
      , Period = require('./models/period')

    key = 'p0' + key;

    getMasterCollection('web').then(function(masterCollection) {
      var match = Periodization.all().get({ id: key })
        , periodMatch
        , redirect

      if (!match) {
        periodMatch = Period.all().get({ id: key });
        if (periodMatch) {
          match = periodMatch.collection.owner;
        }
      }

      if (match) {
        redirect = 'p/web/' + 'periodCollections/' + encodeURIComponent(match.get('id')) + '/';
        Backbone.history.navigate(redirect, { trigger: true, replace: true });
      } else {
        // Render an error
      }
    });
  }
});

module.exports = app = Backbone._app = new ApplicationRouter();
