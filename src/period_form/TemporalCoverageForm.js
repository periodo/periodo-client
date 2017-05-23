"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , TerminusInput = require('./TerminusInput')
    , { Label } = require('axs-ui')
    , { Checkbox } = require('../ui')
    , { wasAutoparsed } = require('periodo-utils/lib/items/terminus')

const emptyTerminus = Immutable.fromJS({
  label: '',
  in: { year: '' }
})

module.exports = class TemporalCoverageForm extends React.Component {
  constructor(props) {
    super();

    this.state = {
      autoparse: (
        (!props.start && !props.stop) ||
        (wasAutoparsed(props.start) && wasAutoparsed(props.stop))
      )
    }
  }

  render() {
    const { autoparse } = this.state
        , { start, stop, onValueChange } = this.props

    return h('div', [
      h('h3', 'Temporal coverage'),
      h('div', [
        h(Label, [
          h(Checkbox, {
            checked: autoparse,
            onChange: () =>
              this.setState(prev => ({ autoparse: !prev.autoparse })),
          }),
          'Parse dates automatically'
        ])
      ]),

      h('h4', 'Start'),
      h(TerminusInput, {
        autoparse,
        terminus: start || emptyTerminus,
        onValueChange: start => onValueChange({ start })
      }),

      h('h4', 'Stop'),
      h(TerminusInput, {
        autoparse,
        terminus: stop || emptyTerminus,
        onValueChange: stop => onValueChange({ stop })
      }),
    ])
  }
}
