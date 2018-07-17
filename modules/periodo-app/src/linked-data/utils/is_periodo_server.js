"use strict";

const { isDataset } = require('periodo-utils').dataset

module.exports = async function isPeriodoServer(rootURL) {
  const headers = new Headers({ 'Content-Type': 'application/ld+json' })

  let rootObj
    , datasetObj

  const rootResp = await fetch(rootURL, { headers })

  if (!rootResp.ok) return false

  try {
    rootObj = await rootResp.json()
  } catch (e) {
    return false
  }

  const datasetURL = rootObj.dataset.url

  if (!datasetURL) return false

  const datasetResp = await fetch(datasetURL)

  if (!datasetResp.ok) return false;

  try {
    datasetObj = await datasetResp.json()
  } catch (e) {
    return false
  }

  return isDataset(datasetObj)
}
