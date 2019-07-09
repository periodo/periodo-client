"use strict";

const registerPromiseWorker = require('promise-worker/register')
    , indexItems = require('../index_items')
    , sort = require('./sort')


module.exports = function sortWorker() {
  let dataset = null

  registerPromiseWorker(message => {
    switch (message.type) {
      case 'initialize':
        dataset = indexItems(message.rawDataset)
        break;

      case 'getSort':
        return sort(dataset.periods, message.field)

      default:
        break;
    }
  })
}
