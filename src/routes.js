"use strict";

const RouteRecognizer = require('route-recognizer')
    , Immutable = require('immutable')

const routes = [
  {
    path: '/',
    name: 'home',
    Component: require('./components/home')
  },

  {
    path: '/p/',
    name: 'backend-select',
    Component: require('./components/backend_select'),
    getData() {
      return require('./backends').list().then(backends => ({ backends }))
    }
  },

  {
    path: '/p/:backendName/',
    name: 'backend-home',
    Component: require('./components/backend_home')
  },

  {
    path: 'p/:backendName/collections/add/',
    name: 'period-collection-add',
    Component: require('./components/period_collection_add'),
    getCursorPath() {
      return ['periodCollections']
    }
  },

  {
    path: 'p/:backendName/collections/:collectionID/',
    name: 'period-collection-show',
    getCursorPath({ collectionID }) {
      return ['periodCollections', decodeURIComponent(collectionID)]
    },
    Component: require('./components/period_collection_show')
  },

  {
    path: 'p/:backendName/collections/:collectionID/edit/',
    name: 'period-collection-edit',
    getCursorPath({ collectionID }) {
      return ['periodCollections', decodeURIComponent(collectionID)]
    },
    Component: require('./components/period_collection_edit')
  },

  {
    path: 'p/:backendName/sync/',
    name: 'sync',
    Component: require('./components/sync'),
    getCursorPath() {
      return []
    }
  },

  {
    path: 'p/:backendName/patches/submit/',
    name: 'patch-submit',
    Component: require('./components/patch_submit')
  },

  {
    path: 'p/:backendName/patches/',
    name: 'local-patch-list',
    Component: require('./components/local_patch_list'),
    getData(store, { backendName }) {
      return require('./backends').get(backendName)
        .then(backend => backend.getSubmittedPatches())
        .then(Immutable.fromJS)
        .then(localPatches => ({ localPatches }))
    }
  },

  {
    path: 'p/:backendName/patches/*patchURI',
    name: 'local-patch-detail',
    Component: require('./components/local_patch_detail'),
    getData: params => Promise.resolve(params)
  },

  {
    path: 'patches/',
    name: 'review-patch-list',
    Component: require('./components/review_patch_list')
  },

  {
    path: 'patches/*patchURI',
    name: 'review-patch-detail',
    Component: require('./components/review_patch_detail'),
    getData: (store, { patchURI }) => Promise.resolve({ patchURI })
  },

  {
    path: 'signin/',
    name: 'sign-in',
    Component: require('./components/signin')
  },

  {
    path: 'signout/',
    Component: require('./components/signout')
  },
]

const router = new RouteRecognizer()

routes.forEach(path => {
  router.add([{ path, handler: routes[path] }], { as: routes[path].name });
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

module.exports = router;
