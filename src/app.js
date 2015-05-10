"use strict";

var $ = require('jquery')
  , Backbone = require('./backbone')
  , backends = require('./backends')
  , errors = require('./errors')
  , Spinner = require('spin.js')
  , root = location.protocol + '//' + location.host
  , ApplicationRouter
  , app

const LEFT_CLICK = 1;

if (!global.Promise) global.Promise = require('dexie').Promise;

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

function handlePageClick(e) {
  var url = require('url')
    , href = e.target.href
    , isLeftClick = e.which === LEFT_CLICK && !e.shiftKey && !e.ctrlKey
    , interceptClick = isLeftClick && href && href.indexOf(root) === 0
    , redirect = !e.target.dataset.noRedirect

  if (interceptClick) {
    e.preventDefault();
    if (redirect) {
      Backbone.history.navigate(url.parse(href).hash, { trigger: true });
    }
  }
}

function initApp() {
  var spinnerEl = document.getElementById('spinner')
    , spinner

  initVersion();

  spinner = new Spinner({
    lines: 12,
    length: 5,
    width: 2,
    radius: 6,
    trail: 40 
  });

  function startSpinner() { spinner.spin(spinnerEl) };
  function stopSpinner() { setTimeout(() => spinner.stop(), 100) }

  app.stopSpinner = stopSpinner;

  app.on('request', startSpinner);
  app.on('sync error requestEnd', stopSpinner);

  app.on('backendSwitch', refreshBackend);

  app.initErrorList();

  checkAuth();

  Backbone.history.start();
}

function ensureIDB(backend) {
  if (backend.type !== 'idb') {
    throw new Error('This functionality is only possible for indexedDB backends.');
  }
  return backend;
}

$(document)
  .ready(initApp)
  .on('click', 'a', handlePageClick)

ApplicationRouter = Backbone.Router.extend({
  routes: {
    '': 'welcome',
    'p/': 'backendSelect',
    'p/:backendName/': 'backendHome',
    'p/:backendName/periodCollections/': 'periodCollectionList',
    'p/:backendName/periodCollections/add/': 'periodCollectionAdd',
    'p/:backendName/periodCollections/:periodCollection/': 'periodCollectionShow',
    'p/:backendName/periodCollections/:periodCollection/edit/': 'periodCollectionEdit',
    'p/:backendName/sync/': 'sync',
    'p/:backendName/patches/submit/': 'submitPatch',
    'p/:backendName/patches/': 'submittedPatches',
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
  handleError: function (err) {
    if (err instanceof errors.NotFoundError) {
      this.changeView(require('./views/not_found'), { msg: err.message });
    } else {
      this.stopSpinner();
      this.addError(err);
      global.console.error(err.stack || err);
    }
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
    window.onerror = (message, filname, line, column, err) => {
      this.addError(err || message);
    }
  },
  addError: function (err) {
    this.errorCollection.add({
      error: err,
      time: new Date()
    });
  },

  welcome: function () {
    var redirectURI = 'p/';

    if (localStorage.currentBackend) {
      redirectURI += localStorage.backend + '/'
    }

    Backbone.history.navigate(redirectURI, { trigger: true, replace: true });
  },

  backendSelect: function () {
    var BackendSelectView = require('./views/backend_select');
    backends.list()
      .then(backendsObj => this.changeView(BackendSelectView, { backends: backendsObj }))
      .catch(err => this.handleError(err))
  },

  backendHome: function (backendName) {
    var IndexView = require('./views/index')

    backends.get(backendName)
      .then(backend => backend.getStore())
      .then(store => {
        this.changeView(IndexView, { store })
      })
      .catch(err => this.handleError(err))
  },

  periodCollectionAdd: function (backendName) {
    var PeriodizationAddView = require('./views/period_collection_add')

    backends.switchTo(backendName)
      .then(() => this.changeView(PeriodizationAddView))
      .catch(err => this.handleError(err))
  },

  periodCollectionShow: function (backendName, periodCollectionID) {
    var PeriodizationView = require('./views/period_collection_show')
      , editable

    periodCollectionID = decodeURIComponent(periodCollectionID)

    backends.get(backendName)
      .then(backend => {
        editable = backend.editable;
        return backend.getStore()
      })
      .then(store => {
        var periodCollection = store.getIn(['data', 'periodCollections', periodCollectionID])

        if (!periodCollection) {
          let msg = `No period collection in ${backendName} with ID ${periodCollectionID}`;
          throw new errors.NotFoundError(msg);
        }

        this.changeView(PeriodizationView, {
          model: periodCollection,
          store,
          editable
        });
      })
      .catch(err => this.handleError(err))
  },

  periodCollectionEdit: function (backendName, periodCollectionID) {
    var PeriodizationEditView = require('./views/period_collection_add')
      , Periodization = require('./models/period_collection')

    periodCollectionID = decodeURIComponent(periodCollectionID)

    backends.get(backendName)
      .then(backend => backend.getMasterCollection())
      .then(() => this.changeView(PeriodizationEditView, {
        model: Periodization.all().get({ id: periodCollectionID })
      }))
      .catch(err => this.handleError(err))
  },

  sync: function (backendName) {
    var SyncView = require('./views/sync')
      , db = require('./db')

    backends.switchTo(backendName)
      .then(ensureIDB)
      .then(backend => db(backend).getLocalData())
      .then(localData => this.changeView(SyncView, { localData }))
      .catch(err => this.handleError(err))
  },

  signin: function () {
    var SignInView = require('./views/signin');
    this.changeView(SignInView, { authCallback: checkAuth });
  },

  signout: function () {
    var SignOutView = require('./views/signout');
    this.changeView(SignOutView, { authCallback: checkAuth });
  },

  submitPatch: function (backendName) {
    var db = require('./db')

    backends.switchTo(backendName)
      .then(ensureIDB)
      .then(backend => db(backend.name).getLocalData())
      .then(localData => this.changeView(
        require('./views/submit_patch'), { localData }
      ))
      .catch(err => this.handleError(err))
  },

  submittedPatches: function (backendName) {
    var db = require('./db')

    backends.switchTo(backendName)
      .then(ensureIDB)
      .then(backend => db(backend.name).localPatches.toArray())
      .then(localPatches => {
        this.changeView(require('./views/local_patches'), { localPatches });
      })
      .catch(err => this.handleError(err))
  },

  // FIXME: This should not actually switch the backend, but rather check if
  // the thing being linked to actually exists before redirection
  attemptRedirect: function (matchKey) {
    matchKey = 'p0' + matchKey;

    backends.get('web')
      .then(backend => backend.fetchData())
      .then(data => {
        var periodCollectionIDs = []
          , redirect = false
          , key

        for (key in data.periodCollections) {
          if (key === matchKey) {
            redirect = true;
            break;
          }
        }

        if (!redirect) {
          for (key in periodCollectionIDs) {
            if ((data.periodCollections[key].definitions || {}).hasOwnProperty(key)) {
              redirect = true;
              break;
            }
          }
        }

        if (redirect) {
          Backbone.history.navigate(
            'p/web/periodCollections/' + key.slice(2) + '/',
            { trigger: true, replace: true })
        } else {
          throw new errors.NotFoundError('Page not found');
        }
      })
      .catch(err => this.handleError(err))
  }
});

module.exports = app = new ApplicationRouter();
