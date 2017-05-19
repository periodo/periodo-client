"use strict";

const h = require('react-hyperscript')
    , Immutable = require('immutable')
    , linkify = require('../../utils/linkify')


const { groupByCode } = require('../../utils/label')


const OriginalLabel = ({ value, language, script }) =>
  h('div', [
    h('dt', 'Original label'),
    h('dd', `${value} (${language}-${script})`)
  ])

const AlternateLabels = ({ alternateLabels }) =>
  alternateLabels.size > 0 && h('div', [
    h('dt', 'Alternate labels'),
    h('dd',
      h('ul', groupByCode(alternateLabels)
        .map((labels, code) => labels.map(label => Immutable.Map({ label, code })))
        .toList()
        .flatten(1)
        .map(label =>
          h('li', { key: label.hashCode() }, `${label.get('label')} (${label.get('code')})`)
        )
      )
    )
  ])

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
