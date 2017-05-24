"use strict";

const h = require('react-hyperscript')
    , Immutable = require('immutable')

function oneOf(data, ...paths) {
  let result;

  for (let i = 0; i < paths.length; i++) {
    result = data.getIn(paths[i]);
    if (result) break;
  }

  return result;
}

function getFields(source) {
  return [
    {
      label: 'Title',
      value: oneOf(source, ['title'], ['partOf', 'title'])
    },
    {
      label: 'Citation',
      value: oneOf(source, ['citation'], ['partOf', 'citation'])
    },
    {
      label: 'URL',
      value: oneOf(source, ['id'], ['partOf', 'id'], ['url']),
      format: url => h('dd', {}, h('a', { href: url }, url))
    },
    {
      label: 'Year published',
      value: oneOf(source, ['yearPublished'], ['partOf', 'yearPublished']) || 'unknown',
    },
    {
      label: 'Creators',
      value: (() => {
        let val = oneOf(source, ['creators'], ['partOf', 'creators']);

        val = (val || Immutable.List()).toList().filter(c => c.get('name'));
        return val.size ? val : null;
      })(),
      format: creators => creators.map(c =>
        h('dd', { key: c.get('name') }, c.get('name'))
      )
    },
    {
      label: 'Contributors',
      value: (() => {
        let val = oneOf(source, ['contributors'], ['partOf', 'contributors']);

        val = (val || Immutable.List()).toList().filter(c => c.get('name'));
        return val.size ? val : null;
      })(),
      format: contributors => contributors.map(c =>
        h('dd', { key: c.get('name') }, c.get('name'))
      )
    },
    {
      label: 'Locator',
      value: source.get('locator')
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
