"use strict";

const R = require('ramda')
    , { FieldList, extract, as } = require('./Field')
    , { LinkValue
      , TextValue
      , LinkifiedTextValue
      , AgentValue,
      } = require('./Value')

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
    values: as('text')(extractFirstOf(orPartOf([ 'title' ]))),
    component: TextValue,
  },
  {
    label: 'Creators',
    values: extractFirstOf(orPartOf([ 'creators' ])),
    component: AgentValue,
  },
  {
    label: 'Contributors',
    values: extractFirstOf(orPartOf([ 'contributors' ])),
    component: AgentValue,
  },
  {
    label: 'Citation',
    values: as('text')(extractFirstOf(orPartOf([ 'citation' ]))),
    component: LinkifiedTextValue,
  },
  {
    label: 'Abstract',
    values: as('text')(extractFirstOf(orPartOf([ 'abstract' ]))),
    component: LinkifiedTextValue,
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
    component: LinkifiedTextValue,
  },
  {
    label: 'Locator',
    values: extract('locator'),
  },
  {
    label: 'Web page',
    values: extractFirstOf(orPartOf([ 'id', 'url' ])),
    component: LinkValue,
  },
  {
    label: 'Same as',
    values: extractFirstOf(orPartOf([ 'sameAs' ])),
    component: LinkValue,
  },
]

exports.Source = FieldList(SOURCE_FIELDS)
