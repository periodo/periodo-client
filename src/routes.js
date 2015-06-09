var RouteRecognizer = require('route-recognizer')
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
    fetchData: function () {
      return require('./backends').list().then(backends => ({ backends }))
    }
  },
  '/p/:backendName/': {
    name: 'backend-home',
    Component: require('./components/backend_home.jsx')
  },
  'p/:backendName/periodCollections/add/': {
    name: 'period-collection-add',
    Component: require('./components/period_collection_add.jsx')
  },
  'signin/': {
    Component: require('./components/signin.jsx')
  },
  'signout/': {
    Component: require('./components/signout.jsx')
  },
    /*
  'p/:backendName/periodCollections/': {
    Component: require('./components/period_collection_list.jsx')
  },
  'p/:backendName/periodCollections/:collectionID/': {
    Component: require('./components/period_collection_show.jsx')
  },
  'p/:backendName/periodCollections/:collectionID/edit/': {
    Component: require('./components/period_collection_edit.jsx')
  },
  'p/:backendName/sync': {
    Component: require('./components/sync.jsx')
  }
  'p/:backendName/patches/': {
    Component: require('./components/patch_list_submitted.jsx')
  },
  'p/:backendName/patches/submit/': {
    Component: require('./components/patch_submit.jsx')
  },
  'p/:backendName/patches/:patchID/': {
    Component: require('./components/patch_show.jsx')
  },
  'reviewPatches/': {
    Component: require('./components/review_patches.jsx')
  },
  '*': {
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
