"use strict";

const React = require('react')
    , Immutable = require('immutable')
    , Dexie = require('dexie')
    , Cursor = require('immutable/contrib/cursor')
    , LocationBar = require('location-bar')
    , h = require('react-hyperscript')

const LEFT_CLICK = 1;

const handlePageClick = (e, locationBar) => {
  let anchor = e.target

  const root = location.protocol + '//' + location.host

  do {
    if (!anchor || anchor.nodeName === 'A') break;
  } while ((anchor = anchor.parentNode));

  if (anchor) {
    const url = require('url')
        , href = anchor.href
        , isLeftClick = e.which === LEFT_CLICK && !e.shiftKey && !e.ctrlKey
        , interceptClick = isLeftClick && href && href.indexOf(root) === 0
        , redirect = !anchor.dataset.noRedirect && href !== root + '/'

    if (interceptClick) {
      e.preventDefault();
      if (redirect) {
        locationBar.update(url.parse(href).hash, { trigger: true });
      }
    }
  }
}

module.exports = React.createClass({
  getInitialState() {
    const user = 'auth' in localStorage ? JSON.parse(localStorage.auth) : null;

    return {
      Component: null,
      backend: null,
      store: null,
      locationBar: null,
      router: null,
      user,
      errors: Immutable.List()
    }
  },

  handleRoute({ Component, getData, getCursorPath }, params) {
    let promise = Promise.resolve({})

    if (params.hasOwnProperty('backendName')) {
      const changeBackend = (
        !this.state.backend ||
        this.state.backend.name !== params.backendName
      )

      if (changeBackend) {
        promise = promise
          .then(() => getBackendAndStore(params.backendName))
          .then(data => ((localStorage.currentBackend = params.backendName), data));
      } else {
        promise = promise.then(() => ({
          backend: this.state.backend,
          store: this.state.store
        }));
      }
    }

    if (getData) {
      let props;
      promise = promise
        .then(_props => props = _props)
        .then(() => getData(props.store, params))
        .then(data => ((props.data = data), props))
    }

    if (getCursorPath) {
      let props;
      promise = promise
        .then(_props => props = _props)
        .then(() => {
          const path = getCursorPath(params)

          const onUpdate = !props.backend.editable ? void 0 : updatedStore => {

            // If cursor path has been set to undefined, delete it from the
            // updated store.
            if (updatedStore.getIn(path) === void 0) {
              updatedStore = updatedStore.deleteIn(path);
            }

            props.backend
              .saveStore(updatedStore)
              .then(() => this.setState({
                store: updatedStore,
                cursor: Cursor.from(updatedStore, path, onUpdate)
              }));
          }

          return Cursor.from(props.store, path, onUpdate);
        })
        .then(cursor => ((props.cursor = cursor), props))
    }

    promise
      .then(props => this.setState({
        Component,
        backend: props.backend || null,
        cursor: props.cursor || null,
        store: props.store || null,
        data: props.data || {}
      }))
      .catch(this.handleError)
  },

  handleError(error) {
    if (!this.state.errors.map(err => err.get('error')).contains(error)) {
      try {
        this.setState(prev => ({
          loading: false,
          errors: prev.errors.push(Immutable.Map({ time: new Date(), error }))
        }));
      } finally {
        throw error;
      }
    }
  },

  attemptRedirect(path) {
    const matchKey = 'p0' + path

    if (path.indexOf('/') !== -1) this.showNotFound();

    getBackendAndStore('Canonical')
      .then(({ store }) => {
        if (store.hasIn(['periodCollections', matchKey])) {
          const redirectURL = this.state.router.generate('period-collection-show', {
            backendName: 'Canonical',
            collectionID: encodeURIComponent(matchKey)
          })

          this.state.locationBar.update(redirectURL, { trigger: true })
        } else {
          let collectionID
            , periodID

          store.get('periodCollections').forEach(collection => {
            if (collection.hasIn(['definitions', matchKey])) {
              collectionID = collection.get('id');
              periodID = matchKey;
              return false;
            }
          });

          if (collectionID) {
            let redirectURL = this.state.router.generate('period-collection-show', {
              backendName: 'Canonical',
              collectionID
            });

            redirectURL += '?show_period=' + periodID;
            this.state.locationBar.update(redirectURL, { trigger: true });
          } else {
            this.showNotFound();
          }
        }
      })
  },

  showNotFound() {
    this.setState({ Component: require('./components/not_found.jsx') });
  },

  componentDidMount() {
    const router = require('./routes')
        , locationBar = new LocationBar()

    locationBar.onChange(path => {
      const match = router.recognize(path);

      if (match) {
        this.handleRoute(match[0].handler, match[0].params);
      } else {
        this.attemptRedirect(path);
      }
    });

    document.addEventListener('click', e => {
      handlePageClick(e, locationBar);
    });

    window.periodo.on('request', () => {
      this.setState({ loading: true });
    });

    window.periodo.on('requestEnd', () => {
      this.setState({ loading: false });
    });

    window.periodo.on('signin', (user) => {
      this.setState({ user });
    });

    window.periodo.on('signout', () => {
      this.setState({ user: null });
    });

    window.periodo.handleError = this.handleError;
    window.periodo.clearErrors = () => this.setState(prev => ({
      errors: prev.errors.clear()
    }));

    Dexie.Promise.on('error', err => {
      this.handleError(err);
    });
    window.onerror = (message, filename, line, column, err) => {
      this.handleError(err || message);
    }

    this.setState({ locationBar, router }, () => locationBar.start());
  },

  render() {
    const Application = require('./components/application.jsx');

    return h(Application, this.state);
  }
});
