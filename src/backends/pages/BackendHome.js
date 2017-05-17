"use strict";

const h = require('react-hyperscript')
    , { connect } = require('react-redux')
    , { fetchBackend } = require('../actions/backends')
    , { Backend } = require('../types')

exports.name = 'backend-home';

exports.path = '/backends/:type/:idOrURL/';

exports.onBeforeRoute = (dispatch, params) => {
  let backend

  const { type, idOrURL } = params

  switch (type) {
    case 'web':
      backend = Backend.Web(decodeURIComponent(idOrURL));
      break;

    case 'local':
      backend = Backend.IndexedDB(parseInt(idOrURL));
      break;

    default:
      throw new Error(`Invalid backend type: ${type}`);
  }


  return dispatch(fetchBackend(backend, true));
}

function mapStateToProps(state) {
  const resp = state.getIn(['backends', 'current'])

  return {
    resp,
    readyState: resp.get('readyState'),
    backend: resp.getIn(['responseData', 'backend']),
    dataset: resp.getIn(['responseData', 'dataset']),
  }
}

const BackendHome = props => {
  switch (props.readyState) {
    case PENDING:
      return h('h1', 'Loading');

    case FAILURE:
      return h('div', [
        h('h1', 'Error'),
        h('pre', props.resp.get('error').toString()),
      ])

    case SUCCESS:
      return h('div', props.loading ? h('Loading...') : [
        h('h1', props.backend.get('label')),
        h('pre', JSON.stringify(props.dataset, true, '  ')),
      ])
  }
}


exports.Component = connect(mapStateToProps)(BackendHome)
