"use strict"

const tags = require('language-tags')

const languageDescription = tag => {
  const language = tags(tag || '').language()

  return language ? language.descriptions()[0] : '(bad value)'
}

const getters = {
  Language: period => languageDescription(period.languageTag),
  ['Spatial coverage']: period => period.spatialCoverageDescription,
}


module.exports = function a(self) {
  self.addEventListener('message', e => {
    const { type, data } = e.data
        , getter = getters[type]
        , counts = {}

    data.forEach(period => {
      const key = getter(period)
      if (!counts[key]) counts[key] = 0
      counts[key]++
    })

    const countArr = Object.entries(counts)
      .sort((a, b) => a[1] - b[1])
      .reverse()

    self.postMessage(countArr)
  })
}
