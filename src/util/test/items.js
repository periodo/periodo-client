"use strict";

const test = require('tape')
    , util = require('../')



test('Period terminus utility functions', t => {
  t.plan(4)

  const termini = require('./fixtures/termini.json')

  t.deepEqual(
    termini.map(util.terminus.earliestYear),
    [1200, 0, 501, -99, (new Date().getFullYear()), null],
    'should find smallest year in terminus'
  )

  t.deepEqual(
    termini.map(util.terminus.latestYear),
    [1200, 0, 600, -99, (new Date().getFullYear()), null],
    'should find largest year in terminus'
  )

  t.deepEqual(
    termini.map(util.terminus.hasISOValue),
    [true, true, true, true, true, false],
    'should detect whether a terminus has any ISO value'
  )

  t.deepEqual(
    termini.map(util.terminus.wasAutoparsed),
    [true, true, true, false, true, false],
    'should detect whether a terminus was autoparsed or not'
  )
})


test('Period terminus sequence utility functions', t => {
  t.plan(2)

  const termini = require('./fixtures/termini.json')

  t.deepEqual(
    util.terminusList.maxYear(termini),
    { label: 'present', iso: (new Date().getFullYear()) },
    'should be able to find the latest terminus in a group'
  )


  t.deepEqual(
    util.terminusList.minYear(termini),
    { label: 'one hundred bee cee', iso: -99 },
    'should be able to find the earliest terminus in a group'
  )
})


test('Period authority utility functions', t => {
  t.plan(1)

  const data = require('./fixtures/period-collection.json')

  t.deepEqual(util.authority.describe(data.periodCollections.p03377f), {
    id: 'p03377f',
    source: 'Ruiz, Arturo. The archaeology of the Iberians. 1998.',
    definitions: 2,
    earliest: {
      iso: -799,
      label: '800 B.C.'
    },
    latest: {
      iso: -205,
      label: '206 B.C.'
    }
  }, 'should describe a period collection')
});

test('Authority sequence utility functions', t => {
  t.plan(1);

  const data = [
    {
      definitions: [
        {
          spatialCoverageDescription: 'Middle East',
          spatialCoverage: [
            { id: 'a' },
          ]
        }
      ]
    },
    {
      definitions: [
        {
          spatialCoverageDescription: 'Middle East',
          spatialCoverage: [
            { id: 'a' },
          ]
        }
      ]
    },
    {
      definitions: [
        {
          spatialCoverageDescription: 'Middle East',
          spatialCoverage: [
            { id: 'a' },
            { id: 'b' },
          ]
        }
      ]
    },
    {
      definitions: [
        {
          spatialCoverageDescription: 'Middle East 2',
          spatialCoverage: [
            { id: 'a' }
          ]
        }
      ]
    },
  ];


  t.deepEqual(
    util.authorityList.spatialCoverages(data),
    [
      {
        label: 'Middle East',
        uses: [
          { count: 2, countries: ['a'] },
          { count: 1, countries: ['a', 'b']}
        ]
      },
      {
        label: 'Middle East 2',
        uses: [
          { count: 1, countries: ['a'] }
        ]
      }
    ], 'Should group spatial coverage collections');
});


test('Multi label periods', t => {
  t.plan(3)

  const multiLabelPeriod = require('./fixtures/multi-label-period.json');

  t.deepEqual(
    util.period.originalLabel(multiLabelPeriod),
    {
      value: 'Progressive Era',
      language: 'eng',
      script: 'latn'
    }, 'should get original label from a period');


  t.deepEqual(
    util.period.allLabels(multiLabelPeriod),
    [
      { value: 'Progressive Era', language: 'eng', script: 'latn' },
      { value: 'The Progressive Era', language: 'eng', script: 'latn' },
      { value: 'Ère progressiste', language: 'fra', script: 'latn' },
    ], 'should get all labels from a period');


  t.deepEqual(
    util.period.alternateLabels(multiLabelPeriod),
    [
      { value: 'The Progressive Era', language: 'eng', script: 'latn' },
      { value: 'Ère progressiste', language: 'fra', script: 'latn' }
    ], 'should get only alternate labels from a period')
});
