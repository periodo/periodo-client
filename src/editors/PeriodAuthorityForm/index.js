"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , { Flex, Box, Heading } = require('axs-ui')
    , { PrimaryButton, TextareaBlock } = require('../../ui')
    , LDSourceForm = require('./LDSourceForm')
    , NonLDSourceForm = require('./NonLDSourceForm')

function isLinkedData(collection) {
  return (
    collection.hasIn(['source', 'id']) ||
    collection.hasIn(['source', 'partOf', 'id'])
  )
}

const emptyCollection = Immutable.Map({
  type: 'PeriodCollection',
  definitions: Immutable.Map()
})

module.exports = class PeriodCollectionForm extends React.Component {
  constructor(props) {
    super();

    this.state = {
      isLinkedData: isLinkedData(props.collection)
    }
  }

  render() {
    const { isLinkedData } = this.state
        , { collection=emptyCollection, onValueChange } = this.props

    return (
      h(Box, [
        h(Flex, [
          h(Box, { width: .5 }, [
            h(Heading, { level: 2 }, 'Source'),
            h(isLinkedData ? LDSourceForm : NonLDSourceForm, {
              onValueChange: source => {
                onValueChange(collection.set('source', source))
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
            value: collection.get('editorialNote', ''),
            onChange: e => {
              onValueChange(collection.set(e.target.value))
            }
          })
        ])

      ])
    )
  }
}
