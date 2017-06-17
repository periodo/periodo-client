"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('axs-ui')
    , { TextareaBlock, InputBlock, Tabs, PrimaryButton, Errors } = require('lib/ui')
    , { isLinkedData } = require('lib/util/source')
    , Validated = require('../Validated')
    , { validateAuthority } = require('../validate')
    , LDSourceForm = require('./LDSourceForm')
    , NonLDSourceForm = require('./NonLDSourceForm')

const lenses = {
  source: R.lensProp('source'),
  locator: R.lensPath(['source', 'locator']),
  editorialNote: R.lensProp('editorialNote'),
}

module.exports = Validated(validateAuthority, class AuthorityForm extends React.Component {
  constructor(props) {
    super();

    this.state = {
      showLDForm: !props.value.source || isLinkedData(props.value)
    }
  }

  render() {
    const { showLDForm } = this.state
        , { value={}, onValueChange, errors } = this.props
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
        errors.source && h(Errors, { mb: 2, errors: errors.source }),

        h(Tabs, {
          tabs: [
            {
              id: 'ld',
              label: 'Linked data source',
              element: sourceFormElement,
            },
            {
              id: 'non-ld',
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

        h(TextareaBlock, {
          mt: 2,
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
        }),

        h(Box, [
          h(PrimaryButton, {
            onClick: () => this.props.validate(value, this.props.onValidated)
          }, 'Save'),
        ]),
      ])
    )
  }
})
