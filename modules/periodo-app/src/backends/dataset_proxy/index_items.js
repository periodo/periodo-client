"use strict"

const { $$Authority, $$RelatedPeriods } = require('periodo-utils/src/symbols')

function emptyRelations() {
  return {
    derivedFrom: {},
    broader: {},
    narrower: {},
  }
}

const relations = Object.keys(emptyRelations())

const inverses = {
  broader: 'narrower',
  narrower: 'broader',
  // derivedFrom: 'derives', # TODO Add this?
}

module.exports = function indexItems(rawDataset) {
  const authoritiesByID = {}
      , periodsByID = {}

  // Index periods and authorities by ID
  Object.values(rawDataset.authorities || {}).forEach(authority => {
    authoritiesByID[authority.id] = authority

    Object.values(authority.periods || {}).forEach(period => {
      periodsByID[period.id] = period

      // Add symbols for circular references not part of the raw dataset
      period[$$Authority] = authority
      period[$$RelatedPeriods] = emptyRelations()
    })
  })

  const authorities = Object.values(authoritiesByID)
      , periods = Object.values(periodsByID)

  // Add references to related periods
  periods.forEach(period => {
    relations.forEach(relation => {
      const inverseRelation = inverses[relation]

      ;[].concat(period[relation] || []).forEach(relatedPeriodID => {
        const relatedPeriod = periodsByID[relatedPeriodID]

        // It's possible that this related period might not exist, if this is
        // a strangely formed dataset.
        if (!relatedPeriod) return

        period[$$RelatedPeriods][relation][relatedPeriodID] = relatedPeriod

        if (inverseRelation) {
          relatedPeriod[$$RelatedPeriods][inverseRelation][period.id] = period
        }
      })
    })
  })

  return {
    authoritiesByID,
    periodsByID,
    authorities,
    periods,
  }
}
