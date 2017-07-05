"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('axs-ui')
    , generateID = require('../../linked-data/utils/generate_skolem_id')
    , { updateLocalDataset } = require('../actions')
    , PeriodForm = require('../../editors/PeriodForm')
    , { trigger } = require('lib/router')

module.exports = class AddPeriod extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      period: props.initialValue || {}
    }
  }

  render() {
    const { dispatch, backend, dataset } = this.props

    return (
      h(Box, [
        h(PeriodForm, {
          value: this.state.period,
          onValidated: async period => {
            const id = generateID()

            await dispatch(updateLocalDataset(
              backend.storage,
              R.assocPath(
                ['periodCollections', id],
                Object.assign({ id }, period),
                dataset
              ),
              `Added period collection ${id}`
            ))

            trigger('backend-home', {
              backendID: backend.asIdentifier()
            })
          },
          onValueChange: period => {
            this.setState({ period })
          }
        }),
      ])
    )
  }
}
