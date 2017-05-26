exports.dataset = [
  { name: 'Neolithic', start: -5600, stop: -4001 },
  { name: 'Copper age', start: -4250, stop: -2201, isNamedAfterMetal: true },
  { name: 'Bronze age', start: -2200, stop: -801, isNamedAfterMetal: true },
]

exports.accessors = {
  period: item => item,
  name: item => item.name
}

exports.layouts = {
  noop: {},

  callTracker: {
    deriveOpts() {
      return { called: true }
    }
  },

  datasetFilterer: {
    filterItems(getRecord) {
      return getRecord('period').isNamedAfterMetal
    }
  }
}
