"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , { Flex, Box, Heading } = require('axs-ui')
    , { PrimaryButton, TextareaBlock } = require('../../ui')
    , LDSourceForm = require('./LDSourceForm')
    , NonLDSourceForm = require('./NonLDSourceForm')

function isLinkedData(authority) {
  return (
    authority.hasIn(['source', 'id']) ||
    authority.hasIn(['source', 'partOf', 'id'])
  )
}

const emptyAuthority = Immutable.Map({
  type: 'PeriodCollection',
  definitions: Immutable.Map()
})

module.exports = class PeriodAuthorityForm extends React.Component {
  constructor(props) {
    super();

    this.state = {
      isLinkedData: props.authority
        ? isLinkedData(props.authority)
        : true
    }
  }

  render() {
    const { isLinkedData } = this.state
        , { authority=emptyAuthority, onValueChange } = this.props

    return (
      h(Box, [
        h(Flex, [
          h(Box, { width: .5 }, [
            h(Heading, { level: 2 }, 'Source'),
            h(isLinkedData ? LDSourceForm : NonLDSourceForm, {
              source: authority.get('source', Immutable.Map()),
              onValueChange: source => {
                onValueChange(authority.set('source', source))
              }
            })
          ]),

          h(Box, { width: .5 }, [
            h(PrimaryButton, {
              onClick: () => {
                this.setState(prev => ({ isLinkedData: !prev.isLinkedData }))
              }
            }, [
              'My source is ',
              isLinkedData ? h('strong', ' not ') : '',
              'linked data ›'
            ])
          ])
        ]),


        h(Box, { width: .33 }, [
          h(Heading, { level: 2 }, 'About'),
          h(TextareaBlock, {
            label: 'Editorial notes',
            helpText: 'Notes about importing this source',
            name: 'editorial-note',
            rows: 5,
            value: authority.get('editorialNote', ''),
            onChange: e => {
              onValueChange(authority.set(e.target.value))
            }
          })
        ])

      ])
    )
  }
}
