"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box } = require('periodo-ui')
    , { TextareaBlock, InputBlock, Tabs, Button$Primary, Errors } = require('periodo-ui')
    , { isLinkedData } = require('../../linked-data/utils/source_ld_match')
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

    const childProps = {
      value: value.source,
      onValueChange: cancel || R.pipe(
        R.set(lenses.source, R.__, value),
        onValueChange
      ),
    }

    const sourceFormElement = h(showLDForm ? LDSourceForm : NonLDSourceForm, {})

    return (
      h(Box, [
        errors.source && h(Errors, { mb: 2, errors: errors.source }),

        h(Flex, { justifyContent: 'space-between' }, [
          h(Box, { width: .48 }, [
            h(Tabs, {
              tabs: [
                {
                  id: 'ld',
                  label: 'Linked data',
                  renderTab: () => h(LDSourceForm, childProps),
                },
                {
                  id: 'non-ld',
                  label: h('span', [h('em', 'Not'), ' linked data']),
                  renderTab: () => h(NonLDSourceForm, childProps),
                }
              ],
              value: showLDForm ? 'ld' : 'non-ld',
              onChange: val => {
                this.setState({ showLDForm: val === 'ld' })
              },
            }),
          ]),

          h(Box, { width: .48 }, [
            h(InputBlock, {
              label: 'Locator',
              mb: 4,
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
                individual periods as you create them.
              `
            }),

            h(TextareaBlock, {
              mb: 4,
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

            h(Box, {
              align: 'right',
              bg: 'gray1',
            }, [
              h(Button$Primary, {
                onClick: () => this.props.validate(value, this.props.onValidated)
              }, 'Save'),
            ]),
          ]),
        ]),

      ])
    )
  }
})
