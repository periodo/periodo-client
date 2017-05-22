"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , dateParser = require('periodo-date-parser')
    , { Box, Button } = require('axs-ui')
    , { InputBlock } = require('../ui')

const emptyTerminus = Immutable.fromJS({
  label: '',
  in: { year: '' }
})

function parse(label) {
  try {
    return Immutable.fromJS(dateParser.parse(label))
  } catch (err) {
    return emptyTerminus.set('label', label)
  }
}

function isMultivalued(terminus) {
  return terminus.hasIn(['in', 'earliestYear'])
}

function toggleMultiValue(terminus) {
  return isMultivalued(terminus)
    ? terminus.update(t => {
        const earliest = t.getIn(['in', 'earliestYear'])

        return t
          .deleteIn(['in', 'earliestYear'])
          .deleteIn(['in', 'latestYear'])
          .setIn(['in', 'year'], earliest || '')
      })
    : terminus.update(t => {
        const year = t.getIn(['in', 'year'])

        return t
          .deleteIn(['in', 'year'])
          .setIn(['in', 'earliestYear'], year || '')
          .setIn(['in', 'latestYear'], '')
      })
}

module.exports = class TerminusInput extends React.Component {
  handleChange(field, e) {
    const { terminus=emptyTerminus, onValueChange } = this.props
        , value = e.target.value

    onValueChange(terminus.setIn([].concat(field), value))
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.autoparse && nextProps.autoparse) {
      this.props.onValueChange(parse(nextProps.terminus.get('label')))
    }
  }

  render() {
    const { terminus, autoparse, onValueChange } = this.props

    return (
      h(Box, [
        h(Box, [
          h(InputBlock, {
            name: 'label',
            label: 'Label',
            onChange: !autoparse
              ? this.handleChange.bind(this, 'label')
              : e => onValueChange(parse(e.target.value))
          })
        ]),

        h(Box, [
          isMultivalued(terminus)
            ? h(InputBlock, {
                name: 'earliestStart',
                label: 'Earliest start',
                disabled: autoparse,
                value: terminus.getIn(['in', 'earliestYear']),
                onChange: this.handleChange.bind(this, ['in', 'earliestYear'])
              })
            : h(InputBlock, {
                name: 'year',
                label: 'Year',
                disabled: autoparse,
                value: terminus.getIn(['in', 'year']),
                onChange: this.handleChange.bind(this, ['in', 'year'])
              }),

          isMultivalued(terminus)
            ? h(InputBlock, {
                name: 'latestStart',
                label: 'Latest start',
                disabled: autoparse,
                value: terminus.getIn(['in', 'latestYear']),
                onChange: this.handleChange.bind(this, ['in', 'latestYear'])
              })
            : h(Box),

          h(Button, {
            disabled: autoparse,
            onClick: () => onValueChange(toggleMultiValue(terminus))
          }, 'Toggle range')
        ])
      ])
    )
  }
}
