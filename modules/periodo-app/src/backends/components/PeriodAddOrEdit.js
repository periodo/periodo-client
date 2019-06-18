"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('periodo-ui')
    , { RandomID } = require('periodo-common')
    , BackendAction = require('../actions')
    , PeriodForm = require('../../forms/PeriodForm')
    , { LocationStreamAware, Route } = require('org-shell')

class AddPeriod extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      period: props.period || {}
    }
  }

  render() {
    const {
      authority,
      dispatch,
      backend,
      datasetProxy,
      locationStream,
      randomID
    } = this.props

    return (
      h(Box, [
        h(PeriodForm, {
          value: this.state.period,
          onValidated: async period => {
            const isEdit = !!period.id
                , id = isEdit ? period.id : randomID('period')

            await dispatch(BackendAction.UpdateLocalDataset(
              backend.storage,
              R.assocPath(
                ['authorities', authority.id, 'periods', id],
                Object.assign({ id }, period),
                datasetProxy.raw
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
}

module.exports = RandomID(LocationStreamAware(AddPeriod))
