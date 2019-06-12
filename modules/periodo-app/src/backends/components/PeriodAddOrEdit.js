"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('periodo-ui')
    , { RandomID } = require('periodo-common')
    , BackendAction = require('../actions')
    , PeriodForm = require('../../forms/PeriodForm')
    , { LocationStreamAware, Route } = require('org-shell')
    , { $$Authority } = require('periodo-utils/src/symbols')

const $$RelatedPeriods = Symbol.for('RelatedPeriods')

const emptyPeriod = () => ({
  [$$RelatedPeriods]: {
    derivedFrom: {},
    broader: {},
    narrower: {}
  }
})

class AddPeriod extends React.Component {
  constructor(props) {
    super(props);

    const period = props.period || emptyPeriod()
    period.narrower = R.keys(period[$$RelatedPeriods].narrower)

    this.state = {
      period,
      related: R.clone(period[$$RelatedPeriods])
    }
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
              if (! (npID in this.state.related.narrower)) {
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
            for (const npID in this.state.related.narrower) {
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
            // restore symbols possibly wiped out by editing
            period[$$Authority] = authority
            if (! ($$RelatedPeriods in period)) {
              period[$$RelatedPeriods] = this.state.related
            }
            this.setState({ period })
          }
        }),
      ])
    )
  }
}

module.exports = RandomID(LocationStreamAware(AddPeriod))
