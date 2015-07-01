"use strict";

var RouteRecognizer = require('route-recognizer')
  , Immutable = require('immutable')
  , router = new RouteRecognizer()
  , routes

routes = {
  '/': {
    name: 'home',
    Component: require('./components/home.jsx')
  },
  '/p/': {
    name: 'backend-select',
    Component: require('./components/backend_select.jsx'),
    getData: function () {
      return require('./backends').list().then(backends => ({ backends }))
    }
  },
  '/p/:backendName/': {
    name: 'backend-home',
    Component: require('./components/backend_home.jsx')
  },
  'p/:backendName/periodCollections/add/': {
    name: 'period-collection-add',
    Component: require('./components/period_collection_add.jsx'),
    getCursorPath: function () {
      return ['periodCollections']
    }
  },
  'p/:backendName/periodCollections/:collectionID/': {
    name: 'period-collection-show',
    getCursorPath: function ({ collectionID }) {
      return ['periodCollections', decodeURIComponent(collectionID)]
    },
    Component: require('./components/period_collection_show.jsx')
  },
  'p/:backendName/periodCollections/:collectionID/edit/': {
    name: 'period-collection-edit',
    getCursorPath: function ({ collectionID }) {
      return ['periodCollections', decodeURIComponent(collectionID)]
    },
    Component: require('./components/period_collection_edit.jsx')
  },
  'p/:backendName/sync/': {
    name: 'sync',
    Component: require('./components/sync.jsx'),
    getCursorPath: function () {
      return []
    }
  },
  'p/:backendName/patches/submit/': {
    name: 'patch-submit',
    Component: require('./components/patch_submit.jsx')
  },
  'p/:backendName/patches/': {
    name: 'local-patch-list',
    Component: require('./components/local_patch_list.jsx'),
    getData: function (store, { backendName }) {
      return require('./backends').get(backendName)
        .then(backend => backend.getSubmittedPatches())
        .then(Immutable.fromJS)
        .then(localPatches => ({ localPatches }))
    }
  },
  'p/:backendName/patches/*patchURI': {
    name: 'local-patch-detail',
    Component: require('./components/local_patch_detail.jsx'),
    getData: params => Promise.resolve(params)
  },
  'patches/': {
    name: 'review-patch-list',
    Component: require('./components/review_patch_list.jsx')
  },
  'patches/*patchURI': {
    name: 'review-patch-detail',
    Component: require('./components/review_patch_detail.jsx'),
    getData: (store, { patchURI }) => Promise.resolve({ patchURI })
  },
  'signin/': {
    name: 'sign-in',
    Component: require('./components/signin.jsx')
  },
  'signout/': {
    Component: require('./components/signout.jsx')
  },
    /*
  'p/:backendName/periodCollections/': {
    Component: require('./components/period_collection_list.jsx')
  },
  */
}

Object.keys(routes).forEach(path => {
  router.add([{ path, handler: routes[path] }], { as: routes[path].name });
});

router.generate = function () {
  var result = RouteRecognizer.prototype.generate.apply(router, arguments);
  if (result) {
    result = '#' + result;
    if (result.slice(-1) !== '/') {
      result += '/';
    }
  }
  return result;
}

module.exports = router;
