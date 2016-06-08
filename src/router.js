"use strict";

const RouteRecognizer = require('route-recognizer')


const routes = {
  '/': {
    name: 'home',
    Component: require('./components/pages/home')
  },
}

/*
  '/p/': {
    name: 'backend-select',
    Component: require('./components/backend_select'),
    opts: {
      loadInitial: () => actions.backend.listAvailableBackends()
    }
  },

  '/p/:backendName/': {
    name: 'backend-home',
    Component: require('./components/backend_home'),
    opts: {
      loadInitial: ({ backendName }) => actions.backend.getBackend(backendName)
    }
  },
}

/*
const backendRoutes = {
  'period-collection-add': {
    path: 'collections/add/',
    Component: require('./components/period_collection_add'),
  },

  'collections/:collectionID/': {
    name: 'period-collection-show',
    Component: require('./components/period_collection_show')
  },

  'collections/:collectionID/edit/': {
    name: 'period-collection-edit',
    Component: require('./components/period_collection_edit')
  },

  'sync/': {
    name: 'sync',
    Component: require('./components/sync'),
  },

  'patches/submit/': {
    name: 'patch-submit',
    Component: require('./components/patch_submit')
  },

  'patches/': {
    name: 'local-patch-list',
    Component: require('./components/local_patch_list'),
    getData(store, { backendName }) {
      return require('./backends').get(backendName)
        .then(backend => backend.getSubmittedPatches())
        .then(Immutable.fromJS)
        .then(localPatches => ({ localPatches }))
    }
  },

  'patches/*patchURI': {
    name: 'local-patch-detail',
    Component: require('./components/local_patch_detail'),
    getData: params => Promise.resolve(params)
  },
}

  'patches/': {
    name: 'review-patch-list',
    Component: require('./components/review_patch_list')
  },

  'patches/*patchURI': {
    name: 'review-patch-detail',
    Component: require('./components/review_patch_detail'),
    getData: (store, { patchURI }) => Promise.resolve({ patchURI })
  },

  'signin/': {
    name: 'sign-in',
    Component: require('./components/signin')
  },

  'signout/': {
    name: 'sign-out',
    Component: require('./components/signout')
  },
  */

module.exports = function () {
  const router = new RouteRecognizer()

  Object.keys(routes).forEach(path => {
    router.add([
      { path, handler: routes[path] }
    ], { as: routes[path].name });
  });

  router.generate = function () {
    let result = RouteRecognizer.prototype.generate.apply(router, arguments);
    if (result) {
      result = '#' + result;
      if (result.slice(-1) !== '/') {
        result += '/';
      }
    }
    return result;
  }

  return router;
}
