"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , fromArray = require('from2-array')
    , React = require('react')
    , { connect } = require('react-redux')
    , { Box } = require('axs-ui')
    , { Button$Default } = require('lib/ui')
    , { RouterKnower } = require('lib/util/hoc')
    , AuthorityLayout = require('../../layouts/authorities')

function mapStateToProps(state) {
  return {
    backend: state.backends.current,
  }
}

class BackendHome extends React.Component {
  constructor() {
    super();

    this.state = {
      spec: {
        groups: [
          {
            layouts: [
              { name: 'authorityList' },
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
          h(Button$Default, {
            is: 'a',
            href: generateRoute('backend-new-authority', { backendID: 'local-' + backend.type.id }),
            display: 'inline-block',
          }, 'Add collection'),
        ]),

        h(AuthorityLayout, {
          backend,
          spec: this.state.spec,
          updateLayoutOpts: this.updateLayoutOpts.bind(this)
        }),
      ])
    )
  }
}

module.exports = R.compose(
  connect(mapStateToProps),
  RouterKnower,
)(BackendHome)
