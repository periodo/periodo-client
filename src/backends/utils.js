"use strict";

function makeEmptyDataset() {
  return {
    periodCollections: {},
    type: 'rdf:Bag'
  }
}

module.exports = {
  makeEmptyDataset,
}
