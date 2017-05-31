"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , fromArray = require('from2-array')
    , React = require('react')
    , { connect } = require('react-redux')
    , LayoutEngine = require('../../layout-engine/Engine')

function mapStateToProps(state) {
  return {
    backend: state.backends.current
  }
}

const getDefinitions = R.pipe(
  R.prop('periodCollections'),
  R.map(R.pipe(R.prop('definitions'), R.values)),
  R.values,
  R.flatten,
)

class BackendHome extends React.Component {
  constructor() {
    super();

    this.state = {
      authority: undefined
    }
  }

  render() {
    return (
      h('div', [
        h('h1', this.props.backend.metadata.label),
        h(LayoutEngine, {
          createReadStream: () =>
            fromArray.obj(getDefinitions(this.props.backend.dataset)),

          layouts: {
            statistics: require('../../layouts/Statistics'),
            list: require('../../layouts/PeriodList'),
          },
          recordAccessors: {
            period: item => item,
          },
          spec: {
            groups: [
              {
                layouts: [
                  { name: 'statistics' },
                  { name: 'list' },
                ]
              }
            ],
          }
        }),
      ])
    )
  }
}

module.exports = connect(mapStateToProps)(BackendHome)
