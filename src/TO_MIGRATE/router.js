"use strict";

const RouteRecognizer = require('route-recognizer')
    , types = require('./types')
    , actions = require('./actions')


const pages = [
  require('./pages/Home'),
  require('./pages/BackendSelect'),
  require('./pages/BackendHome'),
]


module.exports = function () {
  const router = new RouteRecognizer()

  pages.forEach(({ name, path, onLoad, Component }) => {
    const handler = { Component, onLoad, name }

    if (!path || !name) {
      throw new Error('Each page must have a path and name.');
    }

    if (!handler.Component) {
      throw new Error(`Route for ${name} (${path}) has no defined Component.`);
    }

    router.add([{ path, handler }], { as: handler.name });
  });

  router.generate = (...args) => {
    let result = RouteRecognizer.prototype.generate.apply(router, args);

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

