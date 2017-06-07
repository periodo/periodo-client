"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('axs-ui')
    , { TextareaBlock, InputBlock, Tabs } = require('../../ui')
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
      showLDForm: !props.value.source || isLinkedData(props.value)
    }
  }

  render() {
    const { showLDForm } = this.state
        , { value={}, onValueChange } = this.props
        , cancel = onValueChange ? false : R.always(null)

    const sourceFormElement = h(showLDForm ? LDSourceForm : NonLDSourceForm, {
      value: value.source,
      onValueChange: cancel || R.pipe(
        R.set(lenses.source, R.__, value),
        onValueChange
      ),
    })

    return (
      h(Box, [
        h(Tabs, {
          tabs: [
            {
              key: 'ld',
              label: 'Linked data source',
              element: sourceFormElement,
            },
            {
              key: 'non-ld',
              label: 'Linked data source',
              element: sourceFormElement,
            }
          ],
          value: showLDForm ? 'ld' : 'non-ld',
          onChange: val => {
            this.setState({ showLDForm: val === 'ld' })
          },
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
        }),

        h(Box, [
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
