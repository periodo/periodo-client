"use strict";

const pointer = require('json-pointer')

function fmt(collectionID=null, periodID=null, attribute=null) {
  return { collectionID, periodID, attribute }
}

const collectionAttributes = {
  source: true, 
  editorialNote: false,
}

const periodAttributes = {
  localizedLabels: true,
  spatialCoverage: true,
  start: true,
  stop: true,
  source: true,
  url: false,
  sameAs: false,
  label: false,
  language: false,
  languageTag: false,
  note: false,
  editorialNote: false,
  spatialCoverageDescription: false,
}

const test = (attributes, tok, rest) => {
  for (const attr of Object.keys(attributes)) {
    if (attr === tok) {
      const isFinalTok = !attributes[attr]

      return isFinalTok
        ? rest.length === 0
        : true
    }
  }
}

function parse(label) {
  let tok

  const paths = label.split('/').slice(1)

  const advance = () => {
    tok = paths.shift();
  }

  const nope = () => {
    throw new Error('Invalid patch for dataset: ' + label);
  }

  advance();

  if (tok === '@context') return fmt(null, null, '@context')
  if (tok !== 'periodCollections') nope();

  advance();

  let collectionID = tok
  if (!collectionID) nope();

  collectionID = pointer.unescape(collectionID)

  advance();

  if (!tok) return fmt(collectionID);
  if (tok !== 'definitions') {
    const isCollectionAttr = test(collectionAttributes, tok, paths)
    if (!isCollectionAttr) nope();
    return fmt(collectionID, null, tok)
  }

  advance()

  let periodID = tok
  if (!periodID) nope();

  periodID = pointer.unescape(periodID)

  advance();

  if (!tok) return fmt(collectionID, periodID);

  const isPeriodAttr = test(periodAttributes, tok, paths)
  if (!isPeriodAttr) nope();
  return fmt(collectionID, periodID, tok);
}

module.exports = parse
