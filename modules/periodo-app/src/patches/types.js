"use strict";

const R = require('ramda')
    , Type = require('union-type')
    , pointer = require('json-pointer')
    , isURL = require('is-url')

const $$type = Symbol('patch-type')

const ORCID = Type({
  ORCID: {
    url: val => val.startsWith('https://orcid.org/'),
    label: String,
  },
})

const PatchRequest = Type({
  PatchRequest: {
  },
})

const PatchMetadata = Type({
  Remote: {
    url: isURL,
    patchURL: isURL,
    sourceDatasetURL: isURL,
    created: Date,

    mergedBy: Type.ListOf(ORCID),
    createdBy: Type.ListOf(ORCID),
    updatedBy: Type.ListOf(ORCID),
  },

  Local: {
  },
})

const PatchDirection = Type({
  Push: {},
  Pull: {},
})

const PatchFate = Type({
  Accept: {},
  Reject: {},
})

const PatchType = Type({
  Unknown: {},

  ChangeLinkedData: {},

  AddAuthority: {
    authorityID: String,
  },
  RemoveAuthority: {
    authorityID: String,
  },
  ChangeAuthority: {
    authorityID: String,
    attribute: String,
  },

  AddPeriod: {
    authorityID: String,
    periodID: String,
  },
  RemovePeriod: {
    authorityID: String,
    periodID: String,
  },
  ChangePeriod: {
    authorityID: String,
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

  if (tok === 'id' || tok === 'type' || tok === '@context') {
    return patch[$$type] = PatchType.ChangeLinkedData
  }


  if (tok !== 'authorities') {
    return patch[$$type] = PatchType.Unknown
  }

  // Move on from authorities
  if (!advance()) {
    return patch[$$type] = PatchType.Unknown
  }

  const authorityID = pointer.unescape(tok)

  if (!advance()) {
    return patch[$$type] = R.cond([
      [ R.equals('add'), () => PatchType.AddAuthority(authorityID) ],
      [ R.equals('remove'), () => PatchType.RemoveAuthority(authorityID) ],
      [ R.T, () => PatchType.Unknown ],
    ])(op)
  }

  if (tok !== 'periods') {
    return patch[$$type] = PatchType.ChangeAuthority(authorityID, tok)
  }

  // Move on to period definition
  if (!advance()) {
    return patch[$$type] = PatchType.Unknown
  }

  const periodID = pointer.unescape(tok)

  if (!advance()) {
    return patch[$$type] = R.cond([
      [ R.equals('add'), () => PatchType.AddPeriod(authorityID, periodID) ],
      [ R.equals('remove'), () => PatchType.RemovePeriod(authorityID, periodID) ],
      [ R.T, () => PatchType.Unknown ],
    ])(op)
  }

  return patch[$$type] = PatchType.ChangePeriod(authorityID, periodID, tok)
}

function fmt(type) {
  let [ verb ] = type._name.match(/([A-Z][a-z]+)/)
    , message = ''

  const { authorityID, periodID, attribute } = type

  if (verb.slice(-1) !== 'e') {
    verb += 'e';
  }

  verb += 'd';

  message += `${verb} `;

  if (attribute) {
    message += `${attribute} of `
  }

  message += periodID
    ? `period ${periodID} in authority ${authorityID}.`
    : `authority ${authorityID}.`

  return message;
}

PatchType.prototype.getLabel = function (minimal) {
  if (minimal) {
    return this.case({
      Unknown: () => 'Unknown change',
      ChangeLinkedData: () => 'Changed linked data attributes',
      AddAuthority: () => 'Added authority',
      RemoveAuthority: () => 'Removed authority',
      ChangeAuthority: () => 'Changed authority',
      AddPeriod: () => 'Added period',
      RemovePeriod: () => 'Removed period',
      ChangePeriod: () => 'Changed period',
    })
  }

  return this.case({
    Unknown: 'Unknown change',
    _: () => fmt(this),
  })
}

module.exports = {
  PatchDirection,
  PatchFate,
  PatchType,
  PatchRequest,
  PatchMetadata,
}
