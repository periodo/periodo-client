"use strict";

const h = require('react-hyperscript')
    , { compose } = require('redux')
    , { connect } = require('react-redux')
    , { RouterKnower } = require('lib/util/hoc')
    , BackendForm = require('./Form')
    , { Backend } = require('../../types')
    , { addBackend } = require('../../actions')

function mapStateToProps(state) {
  return {
    backends: state.backends.available || []
  }
}

const BackendSelect = props =>
  h('div', [
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
        h('tr', { key: backend.type._url || backend.type._id }, [
          h('td', backend.type._name),
          h('td', [
            h('a', {
              href: props.generateRoute('backend', {
                backendID: backend.type.asIdentifier(),
              })
            }, backend.metadata.label)
          ]),
          h('td', backend.metadata.description),
        ])
      ))
    ]),

    h('h2', 'Add new backend'),

    h(BackendForm, {
      handleSave: state => {
        const { label, description, type } = state

        const backend = type === 'Web'
            ? Backend.WebOf(state)
            : Backend.UnsavedIndexedDB()

        props.addBackend(backend, label, description).then(() => {
          window.location.reload();
        })
      }
    }),
  ])


module.exports = compose(
  RouterKnower,
  connect(mapStateToProps, { addBackend })
)(BackendSelect)


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
                        }} src="assets/noun_433_cc.svg" />
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
                            }} src="assets/noun_304_cc.svg" />
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
