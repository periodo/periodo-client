"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , Immutable = require('immutable')
    , linkify = require('../../utils/linkify')
    , { getOriginalLabel, getAlternateLabels } = require('../../util').period
    , { groupByCode } = require('../../util').label

function Field({ label, value }) {
  return (
    h(Box, [
      h(Box, { is: 'dt' }, label),
      h(Box, { is: 'dd' }, !Array.isArray(value)
        ? value
        : h('ul', value.map(val =>
            h('li', { key: val }, val)
          ))
      )
    ])
  )
}

const fields = [
  {
    label: 'Original label',
    getValue: R.pipe(
      getOriginalLabel,
      d => `${d.value} (${d.language}-${d.script})`)
  },

  {
    label: 'Alternate labels',
    getValue: R.pipe(
      getAlternateLabels,
      R.sortWith([
        R.ascend(x => `${x.language}-${x.script}`),
        R.ascend(R.prop('value')),
      ])
    ),
    render: d => `${d.value} (${d.language}-${d.script})`
  },
  {
    label: 'Alternate labels',
    getValue: R.pipe(

    )
  }
]


const SpatialCoverage = ({ spatialCoverage, linkify }) =>
  spatialCoverage.size > 0 && h('div', [
    h('dt', 'Original label'),
    h('dd',
      h('ul', spatialCoverage.map(({ id, label }) =>
        h('li', {key: id},[
          linkify
            ? label
            : h('a', {href: id, target: '_blank'}, label)
        ]))
      )
    )
  ])


const Terminus = ({ type, terminus }) =>
  h('div', [
    h('dt', type),
    h('dd', [
      terminus.get('label', h('em', '(not given)')),
      terminus.asString() && `(ISO value: ${terminus.asString()})`
    ])
  ])


const simpleFields = period => [
  {
    value: period.getIn(['source', 'locator']),
    label: 'Locator'
  },
  {
    value: linkify(period.getIn(['url'])),
    label: 'URL'
  },
  {
    value: linkify(period.getIn(['sameAs'])),
    label: 'Same as'
  },
  {
    value: period.getIn(['spatialCoverageDescription']),
    label: 'Spatial coverage description'
  }
]

const noteFields = period => [
  {
    value: linkify(period.get('note', '')),
    label: 'Notes in source'
  },
  {
    value: linkify(period.get('editorialNote', '')),
    label: 'Editorial notes'
  }
]



function Period({ period, linkify }) {
  return (
    h('dl', [
      OriginalLabel({ label: period.getOriginalLabel().toJS() }),

      AlternateLabels({ labels: period.getAlternateLabels(), linkify }),

      simpleFields(period).map(({ value, label }) => value && (
        h('div', { key: label }, [
          h('dt', label),
          h('dd', value),
        ])
      )),

      SpatialCoverage(period),

      Terminus({ type: 'Start', terminus: period.start }),

      Terminus({ type: 'Stop', terminus: period.stop }),

      noteFields(period).map(({ value, label }) => value && (
        h('div', { key: label }, [
          h('dt', label),
          h('dd', { dangerouslySetInnerHTML: { __html: value }}),
        ])
      ))
    ])
  )
}

module.exports = Period;
