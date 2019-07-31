"use strict";

const R = require('ramda')
    , { FieldList, extract, extractWithKey } = require('./diffable/Field')
    , { LinkValue
      , TextValue
      , LinkifiedTextValue
      , AgentValue,
      } = require('./diffable/Value')

const extractFirstOf = keysOrPaths => R.pipe(
  R.of,
  R.ap(R.map(extract, keysOrPaths)),
  R.find(R.compose(R.not, R.isEmpty)),
  R.ifElse(R.identity, R.identity, R.always([])),
)

const orPartOf = R.converge(R.concat, [R.identity, R.map(R.pair('partOf'))])

const SOURCE_FIELDS = [
  {
    label: 'Title',
    getValues: extractWithKey('text')(extractFirstOf(orPartOf([ 'title' ]))),
    component: TextValue,
  },
  {
    label: 'Creators',
    getValues: extractFirstOf(orPartOf([ 'creators' ])),
    component: AgentValue,
  },
  {
    label: 'Contributors',
    getValues: extractFirstOf(orPartOf([ 'contributors' ])),
    component: AgentValue,
  },
  {
    label: 'Citation',
    getValues: extractWithKey('text')(extractFirstOf(orPartOf([ 'citation' ]))),
    component: LinkifiedTextValue,
  },
  {
    label: 'Abstract',
    getValues: extractWithKey('text')(extractFirstOf(orPartOf([ 'abstract' ]))),
    component: LinkifiedTextValue,
  },
  {
    label: 'Year published',
    getValues: extractFirstOf(orPartOf([ 'yearPublished' ])),
  },
  {
    label: 'Date accessed',
    getValues: extractFirstOf(orPartOf([ 'dateAccessed' ])),
  },
  {
    label: 'Editorial notes',
    getValues: extractWithKey('text')(extractFirstOf(orPartOf([ 'editorialNote' ]))),
    component: LinkifiedTextValue,
  },
  {
    label: 'Locator',
    getValues: extract('locator'),
  },
  {
    label: 'Web page',
    getValues: extractFirstOf(orPartOf([ 'id', 'url' ])),
    component: LinkValue,
  },
  {
    label: 'Same as',
    getValues: extractFirstOf(orPartOf([ 'sameAs' ])),
    component: LinkValue,
  },
]

exports.Source = FieldList(SOURCE_FIELDS)
