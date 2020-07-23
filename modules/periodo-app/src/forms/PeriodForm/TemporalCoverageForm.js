"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , TerminusInput = require('./TerminusInput')
    , { Label, Flex, Box } = require('periodo-ui')
    , { Checkbox } = require('periodo-ui')
    , { wasAutoparsed } = require('periodo-utils/src/terminus')

const emptyTerminus = {
  label: '',
  in: { year: '' },
}

module.exports = class TemporalCoverageForm extends React.Component {
  constructor(props) {
    super();

    this.state = {
      autoparse: (
        (!props.start && !props.stop) ||
        (wasAutoparsed(props.start) && wasAutoparsed(props.stop))
      ),
    }
  }

  render() {
    const { autoparse } = this.state
        , { start, stop, onValueChange } = this.props

    return h('div', [
      h(Box, { my: 1 }, [
        h(Label, [
          h(Checkbox, {
            mr: 1,
            checked: autoparse,
            onChange: () =>
              this.setState(prev => ({ autoparse: !prev.autoparse })),
          }),
          'Parse dates automatically',
        ]),
      ]),

      h(Flex, {
        alignItems: 'center',
        mt: 2,
      }, [
        h(TerminusInput, {
          autoparse,
          label: 'Start',
          terminus: start || emptyTerminus,
          onValueChange: start => onValueChange({ start }),
        }),
      ]),

      h(Flex, {
        alignItems: 'center',
        mt: 3,
      }, [
        h(TerminusInput, {
          autoparse,
          label: 'Stop',
          terminus: stop || emptyTerminus,
          onValueChange: stop => onValueChange({ stop }),
        }),
      ]),
    ])
  }
}
