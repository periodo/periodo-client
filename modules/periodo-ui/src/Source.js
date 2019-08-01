"use strict";

const h = require('react-hyperscript')
    , { DiffableItem, extract } = require('./diffable/Field')

const {
  LinkValue,
  TextValue,
  LinkifiedTextValue,
  AgentValue,
} = require('./diffable/Value')

function extractSourceOrPartOf(key, opts) {
  return period => {
    const val = extract(key, opts)(period)

    if (Object.keys(val).length) return val

    return extract(['partOf'].concat(key), opts)(period)
  }
}



const sourceFields = [
  {
    label: 'Title',
    getValues: extractSourceOrPartOf('title', { withKey: 'text' }),
    component: TextValue,
  },

  {
    label: 'Creators',
    getValues: extractSourceOrPartOf('creators'),
    component: AgentValue,
  },

  {
    label: 'Contributors',
    getValues: extractSourceOrPartOf('contributors'),
    component: AgentValue,
  },

  {
    label: 'Citation',
    getValues: extractSourceOrPartOf('citation', { withKey: 'text' }),
    component: LinkifiedTextValue,
  },

  {
    label: 'Abstract',
    getValues: extractSourceOrPartOf('abstract', { withKey: 'text' }),
    component: LinkifiedTextValue,
  },

  {
    label: 'Year published',
    getValues: extractSourceOrPartOf('yearPublished'),
  },

  {
    label: 'Date accessed',
    getValues: extractSourceOrPartOf('dateAccessed'),
  },

  {
    label: 'Editorial notes',
    getValues: extractSourceOrPartOf('editorialNote', { withKey: 'text' }),
    component: LinkifiedTextValue,
  },

  {
    label: 'Locator',
    getValues: extract('locator'),
  },

  {
    label: 'Web page',
    getValues: period =>  {
      const id = extractSourceOrPartOf('id')(period)

      if (Object.keys(id).length) return id

      return extractSourceOrPartOf('url')(period)
    },
  },

  {
    label: 'Same as',
    getValues: extractSourceOrPartOf('sameAs'),
    component: LinkValue,
  },
]

function Source(props) {
  return (
    h(DiffableItem, {
      ...props,
      fieldList: sourceFields,
    })
  )
}

module.exports = { Source }
