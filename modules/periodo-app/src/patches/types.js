"use strict";

const R = require('ramda')
    , Type = require('union-type')
    , pointer = require('json-pointer')
    , makeActionType = require('../typed-actions/make_type')
    , { BackendStorage } = require('../backends/types')

const $$type = Symbol('patch-type')

const PatchDirection = Type({
  Push: {},
  Pull: {},
})

const PatchType = Type({
  Unknown: {},

  ChangeContext: {},

  AddAuthority: {
    collectionID: String
  },
  RemoveAuthority: {
    collectionID: String
  },
  ChangeAuthority: {
    collectionID: String,
    attribute: String,
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

PatchType.fromPatch = function fromPath(patch) {
  if (patch[$$type]) return patch[$$type]
  
  const { path, op } = patch

  let tok

  const pathElements = path.split('/').slice(1)
      , advance = () => (tok = pathElements.shift())

  if (!advance()) {
    return patch[$$type] = PatchType.Unknown
  }

  if (tok === '@context') {
    return patch[$$type] = PatchType.ChangeContext
  }

  if (tok !== 'periodCollections') {
    return patch[$$type] = PatchType.Unknown
  }

  // Move on from periodCollections
  if (!advance()) {
    return patch[$$type] = PatchType.Unknown
  }

  const authorityID = pointer.unescape(tok)

  if (!advance()) {
    return patch[$$type] = R.cond([
      [R.equals('add'), () => PatchType.AddAuthority(authorityID)],
      [R.equals('remove'), () => PatchType.RemoveAuthority(authorityID)],
      [R.T, () => PatchType.Unknown]
    ])(op)
  }

  if (tok !== 'definitions') {
    return patch[$$type] = PatchType.ChangeAuthority(authorityID, tok)
  }

  // Move on to period definition
  if (!advance()) {
    return patch[$$type] = PatchType.Unknown
  }

  const periodID = pointer.unescape(tok)

  if (!advance()) {
    return patch[$$type] = R.cond([
      [R.equals('add'), () => PatchType.AddPeriod(authorityID, periodID)],
      [R.equals('remove'), () => PatchType.RemovePeriod(authorityID, periodID)],
      [R.T, () => PatchType.Unknown]
    ])(op)
  }

  return patch[$$type] = PatchType.ChangePeriod(authorityID, periodID, tok)
}

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
    ? `period ${periodID} in authority ${collectionID}.`
    : `authority ${collectionID}.`

  return message;
}

PatchType.prototype.getLabel = function () {
  return this.case({
    Sync: 'Synchronization',
    Multiple: 'Multiple changes',
    Unknown: 'Unknown change',
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
      localDataset: Object,
      remoteDataset: Object,
    }
  ],
  SubmitPatch: [
    {
      backend: BackendStorage,
      patch: Object,
    },
    {
      patchURL: String,
    }
  ]
})

module.exports = {
  PatchDirection,
  PatchAction,
  PatchType,
}
