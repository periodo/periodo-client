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
    getter: period => languageDescription(period.languageTag),
  },

  spatialCoverage: {
    label: 'Spatial coverage',
    getter: period => period.spatialCoverageDescription || null,
  },

  authority: {
    label: 'Authority',
    getter: period => authorityOf(period).id,
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
      const { aspect, selected=new Set(), periods } = message
        , { getter } = aspects[aspect]

      if (!selected.size) {
        return {
          ids: new Set(periods.map(p => p.id)),
        }
      }

      const ids = new Set()

      periods.forEach(period => {
        const val = getter(dataset.periodsByID[period.id])

        if (selected.has(val)) {
          ids.add(period.id)
        }
      })

      return { ids }
    }

    case "get_counts": {
      const { aspect, periods, selected } = message
          , { getter, renderLabel } = aspects[aspect]
          , counts = new Map()

      periods.forEach(period => {
        const key = getter(dataset.periodsByID[period.id])

        if (!counts.has(key)) counts.set(key, 0)
        counts.set(key, counts.get(key) + 1)
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
