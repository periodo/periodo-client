"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Flex, Box } = require('periodo-ui')
    , { valueAsArray, terminus } = require('periodo-utils')
    , RelatedPeriodList = require('./RelatedPeriodList')

const byStartYear = R.comparator(
  (a, b) => terminus.earliestYear(a.start) < terminus.earliestYear(b.start)
)

const RelatedPeriodsForm = ({
    value,
    onValueChange,
    backendID,
    dataset,
    authority,
}) => {

  const related = Symbol.for('RelatedPeriods')
  const periods = R.fromPairs(['broader', 'narrower', 'derivedFrom'].map(
    prop => [
      prop, valueAsArray(prop, value).map(id => value[related][prop][id])
    ]
  ))
  const update = prop => periods => {
    value[prop] = periods.map(({ id }) => id)
    value[related][prop] = R.indexBy(R.prop('id'), periods)
    onValueChange(value)
  }

  return h(Flex, {
    pb: 2,
    borderBottom: '1px solid #ccc'
  }, [

    h(Box, { width: .5, px: 3 }, [
      h(RelatedPeriodList, {
        name: 'broader',
        label: 'Part of',
        helpText: 'Broader period containing this one',
        periods: periods.broader,
        suggestionFilter:
          ({ id }) => value.id !== id && ! value.narrower.includes(id),
        limit: 1,
        authorities: [ authority ],
        backendID,
        onValueChange: update('broader')
      }),
      h(RelatedPeriodList, {
        mt: 2,
        name: 'narrower',
        label: 'Has parts',
        helpText: 'Narrower periods contained by this one',
        periods: R.sort(byStartYear, periods.narrower),
        suggestionFilter: ({ id }) => value.id !== id && value.broader !== id,
        authorities: [ authority ],
        backendID,
        onValueChange: update('narrower')
      })
    ]),

    h(Box, { width: .5, px: 3 }, [
      h(RelatedPeriodList, {
        name: 'derived-from',
        label: 'Derived from',
        helpText: 'Other periods from which this one was derived',
        periods: periods.derivedFrom,
        suggestionFilter: ({ id }) => value.id !== id,
        authorities: Object.values(dataset.authorities),
        backendID,
        onValueChange: update('derivedFrom')
      })
    ]),
  ])
}

module.exports = RelatedPeriodsForm
