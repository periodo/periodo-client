"use strict"

const tags = require('language-tags')
    , { period: { authorityOf }, authority: { displayTitle }} = require('periodo-utils')
    , indexItems = require('../../backends/dataset_proxy/index_items')

const languageDescription = tag => {
  const language = tags(tag || '').language()

  return language ? language.descriptions()[0] : '(bad value)'
}

const getters = {
  Language: {
    getter: period => languageDescription(period.languageTag),
  },
  ['Spatial coverage']: {
    getter: period => period.spatialCoverageDescription || null,
  },
  Authority: {
    getter: period => authorityOf(period).id,
    renderLabel: (id, dataset) => displayTitle(dataset.authoritiesByID[id]),
  },
}


module.exports = function a(self) {
  let dataset

  self.addEventListener('message', e => {
    switch (e.data.type) {
      case "initialize":
        dataset = indexItems(e.data.rawDataset)
        break;

      case "get_counts": {
        const { label, periods } = e.data
          , { getter, renderLabel } = getters[label]
          , counts = new Map()

        periods.forEach(period => {
          const key = getter(dataset.periodsByID[period.id])

          if (!counts.has(key)) counts.set(key, 0)
          counts.set(key, counts.get(key) + 1)
        })

        const countArr = ([...counts])
          .sort((a, b) => a[1] - b[1])
          .reverse()

        if (renderLabel) {
          countArr.forEach(d => {
            d.push(renderLabel(d[0], dataset))
          })
        }

        self.postMessage(countArr)
        break;
      }

      default:
        break;
    }
  })
}
