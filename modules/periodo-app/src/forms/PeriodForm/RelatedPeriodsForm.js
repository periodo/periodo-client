"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Flex, Box } = require('periodo-ui')
    , RelatedPeriodList = require('./RelatedPeriodList')


const RelatedPeriodsForm = ({
    value,
    onValueChange,
    backendID,
    dataset,
    authority,
}) => {

  return h(Flex, {
    pb: 2,
    borderBottom: '1px solid #ccc'
  }, [

    h(Box, { width: .5, px: 3 }, [
      h(RelatedPeriodList, {
        name: 'broader',
        label: 'Part of',
        helpText: 'Broader period containing this one',
        periodIDs: value.broader,
        suggestionFilter:
          ({ id }) => value.id !== id && ! value.narrower.includes(id),
        limit: 1,
        authorities: [ authority ],
        backendID,
        onValueChange: periods => onValueChange(
          periods.length
            ? R.assoc('broader', periods[0].id, value)
            : R.dissoc('broader', value)
        )
      }),
      h(RelatedPeriodList, {
        mt: 2,
        name: 'narrower',
        label: 'Has parts',
        helpText: 'Narrower periods contained by this one',
        periodIDs: value.narrower,
        suggestionFilter: ({ id }) => value.id !== id && value.broader !== id,
        authorities: [ authority ],
        backendID,
        onValueChange: periods => onValueChange(
          R.assoc('narrower', periods.map(({ id }) => id), value)
        )
      })
    ]),

    h(Box, { width: .5, px: 3 }, [
      h(RelatedPeriodList, {
        name: 'derived-from',
        label: 'Derived from',
        helpText: 'Other periods from which this one was derived',
        periodIDs: value.derivedFrom,
        suggestionFilter: ({ id }) => value.id !== id,
        authorities: Object.values(dataset.authorities),
        backendID,
        onValueChange: periods => onValueChange(
          R.assoc('derivedFrom', periods.map(({ id }) => id), value)
        )
      })
    ]),
  ])
}

module.exports = RelatedPeriodsForm
