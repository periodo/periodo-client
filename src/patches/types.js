"use strict";

const Type = require('union-type')
    , makeActionType = require('../typed-actions/make_type')
    , { BackendStorage } = require('../backends/types')

const PatchDirection = Type({
  Push: {},
  Pull: {},
})

const PatchType = Type({
  Sync: {},
  Multiple: {},

  AddPeriodCollection: {
    collectionID: String
  },
  RemovePeriodCollection: {
    collectionID: String
  },
  ChangePeriodCollection: {
    attribute: String,
    collectionID: String
  },

  AddPeriod: {
    collectionID: String,
    periodID: String,
  },
  RemovePeriod: {
    collectionID: String,
    periodID: String,
  },
  ChangePeriod: {
    collectionID: String,
    periodID: String,
    attribute: String,
  },
})

function fmt(type) {
  let [verb] = type._name.match(/([A-Z][a-z]+)/)
    , message = ''

  const { collectionID, periodID, attribute } = type

  if (verb.slice(-1) !== 'e') {
    verb += 'e';
  }

  verb += 'd';

  message += `${verb} `;

  if (attribute) {
    message += `${attribute} of `
  }

  message += periodID
    ? `period ${periodID} in collection ${collectionID}.`
    : `period collection ${collectionID}.`

  return message;
}

PatchType.prototype.getLabel = function () {
  return this.case({
    Sync: 'Synchronization',
    Multiple: 'Multiple changes',
    _: () => fmt(this)
  })
}

const PatchAction = makeActionType('patch', {
  GenerateDatasetPatch: [
    {
      origin: BackendStorage,
      remote: BackendStorage,
      direction: PatchDirection
    },
    {
      patch: Object,
    }
  ]
})

module.exports = {
  PatchDirection,
  PatchAction,
  PatchType,
}
