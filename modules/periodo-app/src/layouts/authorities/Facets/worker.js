"use strict"

const registerPromiseWorker = require('promise-worker/register')
    , tags = require('language-tags')
    , { period: { authorityOf }, authority: { displayTitle }} = require('periodo-utils')
    , indexItems = require('../../../backends/dataset_proxy/index_items')

const languageDescription = tag => {
  const language = tags(tag || '').language()

  return language ? language.descriptions()[0] : '(bad value)'
}

const aspects = {
  language: {
    label: 'Language',
    getter: () => period => languageDescription(period.languageTag),
  },

  spatialCoverage: {
    label: 'Spatial coverage',
    getter: settings => {
      const { use } = settings

      if (use === 'description') {
        return period => period.spatialCoverageDescription || null
      } else {
        return period => (period.spatialCoverage || []).map(sc => sc.label)
      }
    },
  },

  authority: {
    label: 'Authority',
    getter: () => period => authorityOf(period).id,
    renderLabel: (id, dataset) => displayTitle(dataset.authoritiesByID[id]),
  },
}


module.exports = function a() {
  let dataset

  registerPromiseWorker(message => {
    switch (message.type) {
    case "initialize":
      dataset = indexItems(message.rawDataset)
      break;

    case "get_matching": {
      const { aspect, selected=new Set(), settings={}, periods } = message
        , { getter: getterFn } = aspects[aspect]

      if (!selected.size) {
        return {
          ids: new Set(periods.map(p => p.id)),
        }
      }

      const getter = getterFn(settings)
          , ids = new Set()

      periods.forEach(period => {
        const vals = [].concat(getter(dataset.periodsByID[period.id]))

        for (const val of vals) {
          if (selected.has(val)) {
            ids.add(period.id)
            break;
          }
        }
      })

      return { ids }
    }

    case "get_counts": {
      const { aspect, periods, settings, selected } = message
          , { getter: getterFn, renderLabel } = aspects[aspect]
          , { sortBy } = settings
          , counts = new Map()
          , getter = getterFn(settings)

      periods.forEach(period => {
        const keys = [].concat(getter(dataset.periodsByID[period.id]))

        for (const key of keys) {
          if (!counts.has(key)) counts.set(key, 0)
          counts.set(key, counts.get(key) + 1)
        }
      })

      selected.forEach(key => {
        if (!counts.has(key)) counts.set(key, 0)
      })

      const countArr = ([ ...counts ])
        .sort((a, b) => a[1] - b[1])
        .reverse()

      if (renderLabel) {
        countArr.forEach(d => {
          d.push(renderLabel(d[0], dataset))
        })
      }

      return { countArr }
    }

    default:
      break;
    }
  })
}
