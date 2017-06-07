"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Heading } = require('axs-ui')
    , { PrimaryButton, TextareaBlock, InputBlock } = require('../../ui')
    , { isLinkedData } = require('../../util').source
    , LDSourceForm = require('./LDSourceForm')
    , NonLDSourceForm = require('./NonLDSourceForm')

const lenses = {
  source: R.lensProp('source'),
  locator: R.lensPath(['source', 'locator']),
  editorialNote: R.lensProp('editorialNote'),
}

module.exports = class AuthorityForm extends React.Component {
  constructor(props) {
    super();

    this.state = {
      showLDForm: isLinkedData(props.value)
    }
  }

  render() {
    const { showLDForm } = this.state
        , { value={}, onValueChange } = this.props
        , cancel = onValueChange ? false : R.always(null)
        , SourceForm = showLDForm ? LDSourceForm : NonLDSourceForm

    return (
      h(Box, [
        h(Flex, [
          h(Box, { width: .5 }, [
            h(Heading, { level: 2 }, 'Source'),
            h(SourceForm, {
              value: value.source || null,
              onValueChange: cancel || R.pipe(
                R.set(lenses.source, R.__, value),
                onValueChange
              ),
            }),

            h(InputBlock, {
              mt: 2,
              label: 'Locator',
              disabled: !value.source,
              value: (value.source || {}).locator || '',
              onChange: cancel || R.pipe(
                R.path(['target', 'value']),
                R.assoc(lenses.locator, R.__, value),
                onValueChange
              ),
              helpText: `
                If all periods are defined on a single page within this source,
                include that page number here. Otherwise, include a locator for
                individual period definitions as you create them.
              `
              })
          ]),

          // FIXME: This is stupid
          h(Box, { width: .5 }, [
            h(PrimaryButton, {
              onClick: () => {
                this.setState(R.over(R.lensProp('showLDForm'), R.not))
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
            name: 'editorial-note',
            label: 'Editorial notes',
            helpText: 'Notes about importing this source',
            rows: 5,
            value: value.editorialNote || '',
            onChange: cancel || R.pipe(
              R.path(['target', 'value']),
              R.assoc(lenses.editorialNote, R.__, value),
              onValueChange
            )
          })
        ])
      ])
    )
  }
}
