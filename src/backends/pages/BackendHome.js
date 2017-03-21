"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { connect } = require('react-redux')
    , { getBackendWithDataset } = require('../actions/backends')
    , types = require('../types')
    , { PENDING, SUCCESS, FAILURE } = types.readyStates

exports.name = 'backend-home';

exports.path = '/backends/:type/:idOrURL/';

exports.onLoad = function load(dispatch, { type, idOrURL }) {
    let id, url

    if (type === 'web') {
      type = types.backends.WEB;
      url = decodeURIComponent(idOrURL)
    }

    if (type === 'local') {
      type = types.backends.INDEXED_DB;
      id = parseInt(idOrURL);
    }

    return dispatch(getBackendWithDataset({ type, id, url }, true));
}

function mapStateToProps(state) {
  const resp = state.getIn(['backends', 'current'])

  debugger;

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
