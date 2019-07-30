"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Flex, Box } = require('periodo-ui')
    , { period } = require('periodo-utils')
    , RelatedPeriodList = require('./RelatedPeriodList')

const $$RelatedPeriods = Symbol.for('RelatedPeriods')

const RelatedPeriodsForm = ({
    value,
    onValueChange,
    backendID,
    dataset,
    authority,
}) => {
  const relatedPeriods = value[$$RelatedPeriods]

  const update = prop => periods => {
    value[prop] = periods.map(({ id }) => id)
    value[$$RelatedPeriods][prop] = R.indexBy(R.prop('id'), periods)
    onValueChange(value)
  }

  return h(Flex, {
    pb: 2,
    borderBottom: '1px solid #ccc',
  }, [

    h(Box, { width: .5, px: 3 }, [
      h(RelatedPeriodList, {
        name: 'broader',
        label: 'Part of',
        helpText: 'Broader period containing this one',
        periods: Object.values(relatedPeriods.broader),
        suggestionFilter:
          ({ id }) => value.id !== id && ! value.narrower.includes(id),
        limit: 1,
        authorities: [ authority ],
        backendID,
        onValueChange: update('broader'),
      }),
      h(RelatedPeriodList, {
        mt: 2,
        name: 'narrower',
        label: 'Has parts',
        helpText: 'Narrower periods contained by this one',
        periods: R.sort(period.byStartYear, Object.values(relatedPeriods.narrower)),
        suggestionFilter: ({ id }) => value.id !== id && value.broader !== id,
        authorities: [ authority ],
        backendID,
        onValueChange: update('narrower'),
      }),
    ]),

    h(Box, { width: .5, px: 3 }, [
      h(RelatedPeriodList, {
        name: 'derived-from',
        label: 'Derived from',
        helpText: 'Other periods from which this one was derived',
        periods: Object.values(relatedPeriods.derivedFrom),
        suggestionFilter: ({ id }) => value.id !== id,
        authorities: Object.values(dataset.authorities),
        backendID,
        onValueChange: update('derivedFrom'),
      }),
    ]),
  ])
}

module.exports = RelatedPeriodsForm
