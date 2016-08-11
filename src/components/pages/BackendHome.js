const h = require('react-hyperscript')
    , { getBackendWithDataset } = require('../../actions/backends')
    , types = require('../../types')

exports.name = 'backend-home';

exports.path = '/:type/:nameOrURL/';

exports.load = function load(dispatch, { type, nameOrURL }) {
}

module.exports = React.createClass({
  loadComponentData() {
    let name, url

    if (type === 'web') {
      type = types.backends.WEB;
      url = decodeURIComponent(nameOrURL)
    }

    if (type === 'local') {
      type = types.backends.INDEXED_DB;
      name = nameOrURL;
    }

    return dispatch(getBackendWithDataset({ type, name, url }));
  },

  render () {
    return h('h1', 'HOME')
  }
})
