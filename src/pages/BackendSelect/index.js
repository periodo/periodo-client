"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { connect } = require('react-redux')
    , BackendForm = require('./Form')
    , { listAvailableBackends, addBackend } = require('../../actions/backends')

exports.path = '/backends/';

exports.name = 'backend-select';

exports.onLoad = function load(dispatch) {
  return dispatch(listAvailableBackends())
}

function mapStateToProps(state) {
  return {
    backends: state.getIn(['backends', 'available', 'responseData']).backends
  }
}

class UploadFileForm extends React.Component {
  handleFileChange(e) {
    const { setFileBackend } = this.props

    setFileBackend(e.target.files[0]);
  }


  render() {
    return h('div', [
      h('label', [
        'Input file',
        h('input', {
          type: 'file',
          onChange: this.handleFileChange.bind(this)
        })
      ])
    ])
  }
}


const BackendSelect = props =>
  h('div .container', [

    h('h2', 'Existing backends'),

    h('table', [
      h('thead', [
        h('tr', [
          h('td', 'Type'),
          h('td', 'Label'),
          h('td', 'Description'),
        ])
      ]),

      h('tbody', props.backends.map(backend =>
        h('tr', { key: backend.url || backend.id }, [
          h('td', backend.type),
          h('td', backend.label),
          h('td', backend.description),
        ])
      ).toArray())
    ]),

    h('h2', 'Add new backend'),

    h(BackendForm, {
      handleSave: backend => {
        props.addBackend(backend).then(() => {
          window.location.reload();
        })
      }
    }),
  ])


exports.Component = connect(mapStateToProps, { addBackend })(BackendSelect)


  /*
module.exports = React.createClass({
  displayName: 'BackendSelect',

  handleDownloadBackend(backendMap) {
    const saveAs = require('filesaver.js')
        , stringify = require('json-stable-stringify')

    require('../backends').get(backendMap.get('name'))
      .then(backend => backend.fetchData())
      .then(({ data, modified }) => {
        var filename = `periodo-${backendMap.get('name')}-${modified}.json`
          , blob

        data['@context'] = require('../context.json');

        blob = new Blob(
          [stringify(JSON.parse(JSON.stringify(data)), { space: '  ' })],
          { type: 'application/ld+json' }
        )

        saveAs(blob, filename);
      })
  },

  handleDeleteBackend(backend) {
    var { destroy } = require('../backends')
      , sure = confirm(`Delete backend ${backend.get('name')}?`)

    if (sure) {
      destroy(backend.get('name'))
        .then(() => window.location.reload())
    }
  },

  render() {
    var sortedBackends = Immutable.fromJS(this.props.backends)

    sortedBackends = sortedBackends
      .toOrderedMap()
      .sort((a, b) => b.name === 'Canonical' ? 0 : 1)
      .valueSeq()

    return (
      <div>
        <h2>Select backends</h2>
        <p>Select a backend to use.</p>

        <div className="row">
          <div className="col-md-6">
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ textAlign: 'center' }}>Type</th>
                  <th style={{ textAlign: 'center' }}>Download</th>
                  <th style={{ textAlign: 'center' }}>Delete</th>
                </tr>
              </thead>

              <tbody>
                {sortedBackends.map(backend => (
                  <tr key={backend.get('name')}>
                    <td style={{ width: '100%' }}>
                      <a href={'#p/' + backend.get('name') + '/'}>
                        { backend.get('name') }
                      </a>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      { BACKEND_NAMES[backend.get('type')] }
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <a href="" onClick={this.handleDownloadBackend.bind(null, backend)}>
                        <img style={{
                          height: '22px',
                          width: '80px',
                          marginLeft: '6px'
                        }} src="lib/noun_433_cc.svg" />
                      </a>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {
                        backend.get('name') === 'Canonical' ? '' :
                          <a href="" onClick={this.handleDeleteBackend.bind(null, backend)}>
                            <img style={{
                              height: '22px',
                              width: '80px',
                              marginLeft: '6px'
                            }} src="lib/noun_304_cc.svg" />
                          </a>
                      }
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <BackendForm existing={Object.keys(this.props.backends)} />
      </div>
    )
  }
});
*/