"use strict";

var $ = require('jquery')
  , Cursor = require('immutable/contrib/cursor')
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

  function startSpinner() { spinner.spin(spinnerEl) }
  function stopSpinner() { setTimeout(() => spinner.stop(), 100) }

  app.stopSpinner = stopSpinner;

  app.on('request', startSpinner);
  app.on('sync error requestEnd', stopSpinner);

  app.on('backendSwitch', refreshBackend);

  app.initErrorList();

  checkAuth();

  $(document).on('click', 'a', handlePageClick);

  Backbone.history.start();
}

function ensureIDB(backend) {
  if (backend.type !== 'idb') {
    throw new Error('This functionality is only possible for indexedDB backends.');
  }
  return backend;
}

function ensureEditable(msg, backend) {
  msg = msg || 'This functionality is only possible for editable backends';
  if (!backend.editable) throw new Error(msg);
  return backend;
}

ApplicationRouter = Backbone.Router.extend({
  start: initApp,
  routes: {
    '': 'welcome',
    'p/': 'backendSelect',
    'p/:backendName/': 'backendHome',
    'p/:backendName/periodCollections/': 'periodCollectionList',
    'p/:backendName/periodCollections/add/': 'periodCollectionEdit',
    'p/:backendName/periodCollections/:periodCollection/': 'periodCollectionShow',
    'p/:backendName/periodCollections/:periodCollection/edit/': 'periodCollectionEdit',
    'p/:backendName/sync/': 'sync',
    'p/:backendName/patches/submit/': 'submitPatch',
    'p/:backendName/patches/': 'submittedPatches',
    'p/:backendName/patches/:patchID/': 'submittedPatchShow',
    'signin/': 'signin',
    'signout/': 'signout',
    //'reviewPatches/': 'reviewPatches',
    '*anything': 'attemptRedirect'
  },
  _view: null,
  changeView: function (ViewConstructor, options) {
    if (this._view) this._view.remove();
    this._view = new ViewConstructor(options || {});
    this._view.$el.appendTo('#main');
    window.scroll(0, 0);
    return Promise.resolve(this._view);
  },
  handleError: function (err) {
    if (err instanceof errors.NotFoundError) {
      return this.changeView(require('./views/not_found'), { msg: err.message });
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
      redirectURI += localStorage.currentBackend + '/'
    }

    Backbone.history.navigate(redirectURI, { trigger: true, replace: true });
  },

  backendSelect: function () {
    var BackendSelectView = require('./views/backend_select');
    return backends.list()
      .then(backendsObj => this.changeView(BackendSelectView, { backends: backendsObj }))
      .catch(err => this.handleError(err))
  },

  backendHome: function (backendName) {
    var IndexView = require('./views/index')

    return backends.get(backendName)
      .then(backend => backend.getStore())
      .then(store => this.changeView(IndexView, { store }))
      .catch(err => this.handleError(err))
  },

  periodCollectionShow: function (backendName, periodCollectionID) {
    periodCollectionID = decodeURIComponent(periodCollectionID)

    return backends.get(backendName)
      .then(backend => Promise.all([backend, backend.getStore()]))
      .then((backend, store) => {
        var state = { data: store }
          , path = ['periodCollections', periodCollectionID]

        if (!state.data.getIn(path)) {
          let msg = `No period collection in ${backendName} with ID ${periodCollectionID}.`;
          throw new errors.NotFoundError(msg);
        }

        state.cursor = Cursor.from(state.data, path, newData => state.data = newData);

        return this.changeView(require('./views/period_collection_show'), { state, backend });
      })
      .catch(err => this.handleError(err))
  },

  periodCollectionEdit: function (backendName, periodCollectionID) {
    var isNew = !periodCollectionID

    if (isNew) {
      periodCollectionID = require('./utils/generate_skolem_id')();
    } else {
      periodCollectionID = decodeURIComponent(periodCollectionID);
    }

    return backends.get(backendName)
      .then(ensureEditable)
      .then(backend => Promise.all(backend, backend.getStore()))
      .then((backend, store) => {
        var state = { data: store }

        state.data = state.data.setIn(
          ['periodCollections', periodCollectionID, 'id'],
          periodCollectionID);

        state.cursor = Cursor.from(
          state.data,
          ['periodCollections', periodCollectionID],
          newData => { state.data = newData; }
        );

        if (!isNew && state.cursor.deref() === undefined) {
          let msg = `No period collection in ${backendName} with ID ${periodCollectionID}`;
          throw new errors.NotFoundError(msg);
        }

        return this.changeView(require('./views/period_collection_edit'), { state, backend });
      })
      .catch(err => this.handleError(err))
  },

  sync: function (backendName) {
    var SyncView = require('./views/sync')

    return backends.get(backendName)
      .then(ensureIDB)
      .then(backend => Promise.all([backend, backend.getStore()]))
      .then((backend, store) => this.changeView(SyncView, {
        backend,
        state: { data: store }
      }))
      .catch(err => this.handleError(err))
  },

  signin: function () {
    var SignInView = require('./views/signin');
    return this.changeView(SignInView, { authCallback: checkAuth });
  },

  signout: function () {
    var SignOutView = require('./views/signout');
    return this.changeView(SignOutView, { authCallback: checkAuth });
  },

  submitPatch: function (backendName) {
    return backends.get(backendName)
      .then(ensureIDB)
      .then(backend => Promise.all([backend, backend.getStore()]))
      .then((backend, store) => this.changeView(require('./views/submit_patch'), {
        backend,
        state: { data: store }
      }))
      .catch(err => this.handleError(err))
  },

  submittedPatches: function (backendName) {
    var db = require('./db')

    return backends.switchTo(backendName)
      .then(ensureIDB)
      .then(backend => db(backend.name).localPatches.toArray())
      .then(localPatches => this.changeView(require('./views/local_patches'), { localPatches }))
      .catch(err => this.handleError(err))
  },

  submittedPatchShow: function (backendName, patchID) {
    var db = require('./db')

    return backends.switchTo(backendName)
      .then(ensureIDB)
      .then(backend => db(backend.name)
        .localPatches
        .get(decodeURIComponent(patchID)))
      .then(patch => this.changeView(require('./views/local_patch_show'), { patch }))
      .catch(err => this.handleError(err))
  },

    /*
     * WIP
  reviewPatches: function () {
    var _ = require('underscore')
      , url = require('url')
      , ajax = require('./ajax')
      , patchURL = url.resolve(window.location.origin, 'patches')

    ajax.getJSON(patchURL, { resolved: false, open: true })
      .then(([patches]) => {
        var authors

        authors = _.unique(patches.map(patch => patch.created_by))
          .map(orcid => $.ajax({
            url: orcid,
            headers: { Accept: 'text/turtle' }
          }))

        Promise.all(authors)
          .then(authorsTTL => {
            debugger;
          });
      });
  },
  */

  // FIXME: This should not actually switch the backend, but rather check if
  // the thing being linked to actually exists before redirection
  attemptRedirect: function (matchKey) {
    matchKey = 'p0' + matchKey;

    return backends.get('web')
      .then(backend => backend.fetchData())
      .then(data => {
        var periodCollectionIDs = []
          , redirect = false
          , key

        for (key in data.data.periodCollections) {
          if (key === matchKey) {
            redirect = true;
            break;
          } else {
            periodCollectionIDs.push(key);
          }
        }

        if (!redirect) {
          for (key in periodCollectionIDs) {
            key = periodCollectionIDs[key];
            if ((data.data.periodCollections[key].definitions || {}).hasOwnProperty(matchKey)) {
              redirect = true;
              break;
            }
          }
        }

        if (redirect) {
          Backbone.history.navigate(
            'p/web/periodCollections/' + key + '/',
            { trigger: true, replace: true })
        } else {
          throw new errors.NotFoundError('Page not found');
        }
      })
      .catch(err => this.handleError(err))
  }
});

module.exports = app = new ApplicationRouter();
