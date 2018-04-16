"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('axs-ui')
    , generateID = require('../../linked-data/utils/generate_skolem_id')
    , { updateLocalDataset } = require('../actions')
    , PeriodForm = require('../../editors/PeriodForm')
    , { LocationStreamAware, Route } = require('org-shell')

module.exports = LocationStreamAware(class AddPeriod extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      period: props.initialValue || {}
    }
  }

  render() {
    const { authority, dispatch, backend, dataset, locationStream } = this.props

    return (
      h(Box, [
        h(PeriodForm, {
          value: this.state.period,
          onValidated: async period => {
            const isEdit = !!period.id
                , id = isEdit ? period.id : generateID()

            await dispatch(updateLocalDataset(
              backend.storage,
              R.assocPath(
                ['periodCollections', authority.id, 'definitions', id],
                Object.assign({ id }, period),
                dataset
              ),
              isEdit
                ? `Edited period ${id} in authority ${authority.id}`
                : `Added period ${id} to authority ${authority.id}`
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
})
