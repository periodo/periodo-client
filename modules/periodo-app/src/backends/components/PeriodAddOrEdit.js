"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('periodo-ui')
    , { RandomID } = require('periodo-common')
    , BackendAction = require('../actions')
    , PeriodForm = require('../../forms/PeriodForm')
    , { LocationStreamAware, Route } = require('org-shell')

// FIXME: this assumes that narrower periods are always from the
// same authority; this could possibly change in the future.
const findNarrower = (periodID, authority) => Object.values(authority.periods)
  .reduce((narrower, period) => period.broader === periodID
    ? narrower.concat(period.id)
    : narrower, []
)

class AddPeriod extends React.Component {
  constructor(props) {
    super(props);

    const period = props.period || {}

    // to be modified during editing
    period.narrower = period.id
      ? findNarrower(period.id, props.authority)
      : []

    // for comparison after editing is finished
    const narrower = R.clone(period.narrower)

    this.state = { period, narrower }
  }

  render() {
    const {
      authority,
      dispatch,
      backend,
      dataset,
      locationStream,
      randomID,
      gazetteers
    } = this.props

    return (
      h(Box, [
        h(PeriodForm, {
          value: this.state.period,
          gazetteers,
          backendID: backend.asIdentifier(),
          dataset,
          authority,
          onValidated: async period => {

            const isEdit = !!period.id
                , id = isEdit ? period.id : randomID('period')

            const narrower = period.narrower
            delete period.narrower

            let updatedDataset = R.assocPath(
              ['authorities', authority.id, 'periods', id],
              Object.assign({ id }, period),
              dataset
            )

            let message = isEdit
              ? `Edited period ${id} in authority ${authority.id}`
              : `Added period ${id} to authority ${authority.id}`

            // FIXME: this assumes that narrower periods are always from the
            // same authority; this could possibly change in the future.
            for (const npID of narrower) {
              if (! this.state.narrower.includes(npID)) {
                updatedDataset = R.assocPath(
                  ['authorities', authority.id, 'periods', npID, 'broader'],
                  id,
                  updatedDataset
                )
                message += (
                  `; added broader reference to it from period ${npID}`)
              }
            }
            // FIXME: this assumes that narrower periods are always from the
            // same authority; this could possibly change in the future.
            for (const npID of this.state.narrower) {
              if (! narrower.includes(npID)) {
                updatedDataset = R.dissocPath(
                  ['authorities', authority.id, 'periods', npID, 'broader'],
                  updatedDataset
                )
                message += (
                  `; removed broader reference to it from period ${npID}`)
              }
            }

            await dispatch(BackendAction.UpdateLocalDataset(
              backend.storage,
              updatedDataset,
              message
            ))

            locationStream.write({
              route: Route('authority-view', {
                backendID: backend.asIdentifier(),
                authorityID: authority.id,
              })
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

module.exports = RandomID(LocationStreamAware(AddPeriod))
