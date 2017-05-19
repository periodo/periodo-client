"use strict";

const h = require('react-hyperscript')
    , Immutable = require('immutable')


const oneOf = (data, path, ...otherPaths) =>
  !path
    ? null
    : data.getIn(path) || oneOf(data, ...otherPaths)


const creatorsWithNames = (data, nameField) =>
  (oneOf(data, [nameField], ['partOf', nameField]) || Immutable.List())
    .reduce((acc, creator) =>
      creator.name
        ? (acc || Immutable.List()).push(creator)
        : acc, null)


const Field = (label, value, format) =>
  value && h('div', [
    h('dt', label),
    format ? format(value) : h('dd', value)
  ])


function Source({ source }) {
  const oneOfSource = oneOf.bind(null, source)

  return (
    h('dl', [
      Field(
        'Title',
        oneOfSource(['title'], ['partOf', 'title'])),

      Field(
        'Citation',
        oneOfSource(['citation'], ['partOf', 'citation'])),

      Field(
        'URL',
        oneOfSource(['id'], ['partOf', 'id'], ['url']),
        url => h('dd', h('a', {href: url}, url))),

      Field(
        'Year published',
        oneOfSource(['yearPublished'], ['partOf', 'yearPublished']) || 'unknown'),

      Field(
        'Creators',
        creatorsWithNames(source, 'creators'),
        creators => creators.map(({ name }) => h('dd', {key:name}, name))),

      Field(
        'Contributors',
        creatorsWithNames(source, 'contributors'),
        contributors => contributors.map(({ name }) => h('dd', {key:name}, name))),

      Field('Locator', source.get('locator'))
    ])
  )
}

module.exports = Source;
