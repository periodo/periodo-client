"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , { Field, FieldsDiff, getFields } = require('./Field')
    , { Link, Text, LinkifiedText } = require('./Misc')
    , { extract, as } = require('../util/misc')

const extractFirstOf = keysOrPaths => R.pipe(
  R.of,
  R.ap(R.map(extract, keysOrPaths)),
  R.find(R.compose(R.not, R.isEmpty)),
  R.ifElse(R.identity, R.identity, R.always([])),
)

const names = R.pipe(
  R.filter(({name}) => name),
  R.map(R.prop('name')),
)

const orPartOf = R.converge(R.concat, [R.identity, R.map(R.pair('partOf'))])

const SOURCE_FIELDS = [
  {
    label: 'Title',
    values: as('text')(extractFirstOf(orPartOf([ 'title' ]))),
    valueComponent: Text,
    diffInside: true,
  },
  {
    label: 'Creators',
    values: R.pipe(
      extractFirstOf(orPartOf([ 'creators' ])),
      names
    ),
  },
  {
    label: 'Contributors',
    values: R.pipe(
      extractFirstOf(orPartOf([ 'contributors' ])),
      names
    )
  },
  {
    label: 'Citation',
    values: as('text')(extractFirstOf(orPartOf([ 'citation' ]))),
    valueComponent: LinkifiedText,
    diffInside: true,
  },
  {
    label: 'Abstract',
    values: as('text')(extractFirstOf(orPartOf([ 'abstract' ]))),
    valueComponent: LinkifiedText,
    diffInside: true,
  },
  {
    label: 'Year published',
    values: extractFirstOf(orPartOf([ 'yearPublished' ])),
  },
  {
    label: 'Date accessed',
    values: extractFirstOf(orPartOf([ 'dateAccessed' ])),
  },
  {
    label: 'Editorial notes',
    values: as('text')(extractFirstOf(orPartOf([ 'editorialNote' ]))),
    valueComponent: LinkifiedText,
    diffInside: true,
  },
  {
    label: 'Locator',
    values: extract('locator'),
  },
  {
    label: 'Web page',
    values: as('url')(extractFirstOf(orPartOf([ 'id', 'url' ]))),
    valueComponent: Link,
  },
  {
    label: 'Same as',
    values: as('url')(extractFirstOf(orPartOf([ 'sameAs' ]))),
    valueComponent: Link,
  },
]

const fields = getFields(SOURCE_FIELDS)

exports.Source = function Source(props) {
  const { source } = props
  return h(
    Box,
    R.merge(R.omit(['source'], props), { is: 'dl' }),
    R.map(Field, fields(source))
  )
}

exports.SourceDiff = function SourceDiff(props) {
  const { sourceA, sourceB } = props
  return h(
    FieldsDiff,
    R.merge(
      R.omit(['sourceA', 'sourceB'], props),
      { fieldsA: fields(sourceA), fieldsB: fields(sourceB) }
    )
  )
}
