"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('periodo-ui')
    , BackendAction = require('../actions')
    , PeriodForm = require('../../forms/PeriodForm')
    , { Navigable, Route } = require('org-shell')
    , { $$Authority } = require('periodo-utils/src/symbols')
    , createSkolemID = require('../../linked-data/utils/generate_skolem_id')

const $$RelatedPeriods = Symbol.for('RelatedPeriods')

const emptyPeriod = () => ({
  [$$RelatedPeriods]: {
    derivedFrom: {},
    broader: {},
    narrower: {},
  },
})

function shallowClone(obj) {
  const clone = {}

  Object.entries(obj).forEach(([ k, v ]) => {
    clone[k] = v
  })

  return clone
}

class AddPeriod extends React.Component {
  constructor(props) {
    super(props);

    const period = props.period || emptyPeriod()
    period.narrower = R.keys(period[$$RelatedPeriods].narrower)

    this.state = {
      period,
      originalRelated: R.clone(period[$$RelatedPeriods]),
      related: shallowClone(period[$$RelatedPeriods]),
    }
  }

  render() {
    const { period } = this.state
        , isEdit = !!period.id

    const {
      authority,
      dispatch,
      backend,
      dataset,
      navigateTo,
      gazetteers,
      params: { returnTo },
    } = this.props

    return (
      h(Box, [
        h(PeriodForm, {
          mb: 4,
          value: period,
          gazetteers,
          backendID: backend.asIdentifier(),
          dataset,
          authority,
          onValidated: async period => {

            const id = isEdit ? period.id : createSkolemID()

            const narrower = period.narrower
            delete period.narrower

            let updatedRawDataset = R.assocPath(
              [ 'authorities', authority.id, 'periods', id ],
              {
                id,
                ...period,
              },
              dataset.raw
            )

            let message = isEdit
              ? `Edited period ${id} in authority ${authority.id}`
              : `Added period ${id} to authority ${authority.id}`

            // FIXME: this assumes that narrower periods are always from the
            // same authority; this could possibly change in the future.
            for (const npID of narrower) {
              if (! (npID in this.state.originalRelated.narrower)) {
                updatedRawDataset = R.assocPath(
                  [ 'authorities', authority.id, 'periods', npID, 'broader' ],
                  id,
                  updatedRawDataset
                )
                message += (
                  `; added broader reference to it from period ${npID}`)
              }
            }
            // FIXME: this assumes that narrower periods are always from the
            // same authority; this could possibly change in the future.
            for (const npID in this.state.originalRelated.narrower) {
              if (! narrower.includes(npID)) {
                updatedRawDataset = R.dissocPath(
                  [ 'authorities', authority.id, 'periods', npID, 'broader' ],
                  updatedRawDataset
                )
                message += (
                  `; removed broader reference to it from period ${npID}`)
              }
            }

            await dispatch(BackendAction.UpdateLocalDataset(
              backend.storage,
              updatedRawDataset,
              message
            ))

            navigateTo(returnTo || new Route('period-view', {
              backendID: backend.asIdentifier(),
              authorityID: authority.id,
              periodID: id,
            }))
          },

          onCancel: !isEdit ? null : () => {
            navigateTo(returnTo || new Route('period-view', {
              backendID: backend.asIdentifier(),
              authorityID: authority.id,
              periodID: period.id,
            }))
          },

          onDelete: !isEdit ? null : async () => {
            const updatedRawDataset = R.dissocPath(
              [ 'authorities', authority.id, 'periods', period.id ],
              dataset.raw)

            const message = `Deleted period ${period.id} in authority ${authority.id}`

            await dispatch(BackendAction.UpdateLocalDataset(
              backend.storage,
              updatedRawDataset,
              message
            ))

            navigateTo(new Route('authority-view', {
              backendID: backend.asIdentifier(),
              authorityID: authority.id,
            }))
          },

          onValueChange: period => {
            let { related } = this.state

            // restore symbols possibly wiped out by editing
            period[$$Authority] = authority
            if (! ($$RelatedPeriods in period)) {
              period[$$RelatedPeriods] = this.state.related
            } else {
              related = period[$$RelatedPeriods]
            }

            this.setState({
              period,
              related,
            })
          },
        }),
      ])
    )
  }
}

module.exports = Navigable(AddPeriod)
