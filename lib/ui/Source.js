"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , { Diff } = require('./Diff')
    , { oneOf } = require('../util/misc')

const inOrPartOf = defaultValue => field => R.pipe(
  oneOf(
    R.prop(field),
    R.path(['partOf', field]),
    R.always(defaultValue)
  ),
  R.ifElse(Array.isArray, R.identity, Array.of)
)

function getFields(source) {
  return [
    {
      label: 'Title',
      values: inOrPartOf([])('title')(source),
    },
    {
      label: 'Citation',
      values: inOrPartOf([])('citation')(source),
    },
    {
      label: 'URL',
      values: inOrPartOf([source.url])('id')(source),
      format: url => h('a', { href: url }, url)
    },
    {
      label: 'Year published',
      values: inOrPartOf(['unknown'])('yearPublished')(source)
    },
    {
      label: 'Creators',
      values: inOrPartOf([])('creators')(source)
        .filter(R.prop('name'))
        .map(R.prop('name'))
    },
    {
      label: 'Contributors',
      values: inOrPartOf([])('contributors')(source)
        .filter(R.prop('name'))
        .map(R.prop('name'))
    },
    {
      label: 'Locator',
      values: [source.locator],
    }
  ]
}

const descriptions = R.addIndex(R.map)((v, i) => h('dd', { key: `v${i}` }, v))

const pad = n => array => R.concat(array, Array(n).fill(''))

const ensureSameLength = (stringsA, stringsB) => (
  stringsA.length < stringsB.length
    ? [ pad(stringsB.length - stringsA.length)(stringsA), stringsB ]
    : [ stringsA, pad(stringsA.length - stringsB.length)(stringsB) ]
)

exports.Source = function Source({ source }) {
  const fields = getFields(source).filter(({values}) => values.length > 0)
  return (
    h('dl', fields.map(({ label, values, format }) =>
      h('div', { key: label }, [
        h('dt', label),
        descriptions(format ? values.map(format) : values)
      ])
    ))
  )
}

exports.SourceDiff = function SourceDiff({ sourceA, sourceB }) {
  const fieldsA = getFields(sourceA)
      , fieldsB = getFields(sourceB)

  return h(
    'dl',
    R.map(
      i => {
        const valuesA = fieldsA[i].values
            , valuesB = fieldsB[i].values

        const backgroundColor = valuesA.length === 0
          ? Diff.colors.insert
          : valuesB.length === 0
            ? Diff.colors.delete
            : null

        const pairs = R.zip(...ensureSameLength(valuesA, valuesB))

        return h(Box, { key: fieldsA[i].label, backgroundColor}, [
          h('dt', fieldsA[i].label),
          descriptions(pairs.map(pair => h(Diff, { pair })))
        ])
      },
      R.range(0, fieldsA.length)
        .filter(i => fieldsA[i].values.length + fieldsB[i].values.length)
    )
  )
}
