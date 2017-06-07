"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , fromArray = require('from2-array')
    , React = require('react')
    , { connect } = require('react-redux')
    , { Box } = require('axs-ui')
    , { DefaultButton } = require('../../ui')
    , { RouterKnower } = require('../../util').hoc
    , LayoutEngine = require('../../layout-engine/Engine')

function mapStateToProps(state) {
  return {
    backend: state.backends.current,
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
      spec: {
        groups: [
          {
            layouts: [
              { name: 'text' },
            ]
          },

          {
            layouts: [
              { name: 'statistics' },
              {
                name: 'list',
                props: {
                  css: {
                    minHeight: '500px',
                  }
                }
              },
            ]
          }
        ]
      }
    }

    this.updateLayoutOpts = this.updateLayoutOpts.bind(this);
  }

  updateLayoutOpts(i, j, fn) {
    this.setState(prev => {
      const spec = R.over(R.lensPath(['groups', i, 'layouts', j, 'opts']), fn, prev.spec)

      return { spec }
    })
  }

  render() {
    const { backend, generateRoute } = this.props

    return (
      h('div', [
        h('h1', backend.metadata.label),
        backend.isEditable && h(Box, [
          h(DefaultButton, {
            is: 'a',
            href: generateRoute('local-backend-add-authority', { id: backend.type.id }),
            display: 'inline-block',
          }, 'Add collection'),
        ]),
        h(LayoutEngine, {
          createReadStream: () =>
            fromArray.obj(getDefinitions(backend.dataset)),

          layouts: {
            statistics: require('../../layouts/Statistics'),
            list: require('../../layouts/PeriodList'),
            text: require('../../layouts/TextSearch'),
          },

          spec: this.state.spec,

          updateLayoutOpts: this.updateLayoutOpts,
        }),
      ])
    )
  }
}

module.exports = R.compose(
  connect(mapStateToProps),
  RouterKnower,
)(BackendHome)
