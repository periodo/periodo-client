"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { oneOf } = require('../util/misc')

const inOrPartOf = (field, source) =>
  oneOf(
    R.prop(field),
    R.path(['partOf', field])
  )(source)


function getFields(source) {
  return [
    {
      label: 'Title',
      value: inOrPartOf('title', source),
    },
    {
      label: 'Citation',
      value: inOrPartOf('citation', source),
    },
    {
      label: 'URL',
      value: inOrPartOf('id', source) || source.url,
      format: url => h('dd', {}, h('a', { href: url }, url))
    },
    {
      label: 'Year published',
      value: inOrPartOf('yearPublished', source) || 'unknown'
    },
    {
      label: 'Creators',
      value: (() => {
        const val = inOrPartOf('creators', source)

        if (!val) return null;

        return val.filter(c => c.name)
      })(),
      format: creators => creators.map((c, i) =>
        h('dd', { key: i + c.name }, c.name)
      )
    },
    {
      label: 'Contributors',
      value: (() => {
        const val = inOrPartOf('contributors', source)

        if (!val) return null;

        return val.filter(c => c.name)
      })(),
      format: contributors => contributors.map((c, i) =>
        h('dd', { key: i + c.name }, c.name)
      )
    },
    {
      label: 'Locator',
      value: source.locator,
    }
  ]
}

exports.Source = function Source({ source }) {
  const fields = getFields(source)

  return (
    h('dl', fields.filter(entry => entry.value).map(({ label, value, format }) =>
      h('div', { key: label }, [
        h('dt', label),
        format ? format(value) : h('dd', value),
      ])
    ))
  )
}
