"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Section, SectionHeading, Errors, Tabs } = require('periodo-ui')
    , { TextareaBlock, InputBlock, Button } = require('periodo-ui')
    , { isLinkedData } = require('../../linked-data/utils/source_ld_match')
    , Validated = require('../Validated')
    , { validateAuthority } = require('../validate')
    , LDSourceForm = require('./LDSourceForm')
    , NonLDSourceForm = require('./NonLDSourceForm')

const lenses = {
  source: R.lensProp('source'),
  locator: R.lensPath([ 'source', 'locator' ]),
  editorialNote: R.lensProp('editorialNote'),
}

module.exports = Validated(
  validateAuthority,
  class AuthorityForm extends React.Component {

    constructor(props) {
      super();

      this.state = {
        showLDForm: !props.value.source || isLinkedData(props.value.source),
      }
    }

    render() {
      const { showLDForm } = this.state

      const {
        value={},
        validate,
        onValueChange,
        onValidated,
        onCancel,
        errors,
        ...props
      } = this.props

      const get = lens => R.view(lens, value) || ''
      , set = (lens, val) => onValueChange(R.set(lens, val, value))

      const formProps = {
        value: get(lenses.source),
        onValueChange: value => set(lenses.source, value),
      }

      return (
        h(Box, {
          ...props,
        }, [

          h(SectionHeading, 'Authority source'),

          errors.source && h(Errors, {
            mb: 2,
            errors: errors.source,
          }),

          h(Section, [
            h(Tabs, {
              tabs: [
                {
                  id: 'ld',
                  label: 'Most published sources',
                  renderTab: () => h(LDSourceForm, formProps),
                },
                {
                  id: 'non-ld',
                  label: 'Other sources',
                  renderTab: () => h(NonLDSourceForm, formProps),
                },
              ],
              value: showLDForm ? 'ld' : 'non-ld',
              onChange: val => {
                this.setState({ showLDForm: val === 'ld' })
              },
            }),
          ]),

          h(SectionHeading, 'Further information about the authority'),

          h(Section, [
            h(InputBlock, {
              label: 'Locator',
              disabled: !value.source,
              value: get(lenses.locator),
              onChange: e => set(lenses.locator, e.target.value),
              helpText: `
              If all periods are defined on a single page within the
              source above, include that page number here. Otherwise,
              include a locator for individual periods as you create
              them.
            `,
            }),

            h(TextareaBlock, {
              mt: 3,
              name: 'editorial-note',
              label: 'Editorial notes',
              helpText: `
              Notes explaining why this authority is interesting or
              useful, and other good things to know
            `,
              rows: 5,
              value: get(lenses.editorialNote),
              onChange: e => set(lenses.editorialNote, e.target.value),
            }),
          ]),

          h(Flex, {
            justifyContent: 'space-between',
          }, [
            h('div', [
              !onCancel ? null : (
                h(Button, {
                  variant: 'danger',
                  onClick: () => onCancel(),
                }, 'Cancel')
              ),
            ]),

            h('div', [
              h(Button, {
                variant: 'primary',
                onClick: () => validate(value, onValidated),
              }, 'Save'),
            ]),
          ]),
        ])
      )
    }
  }
)
