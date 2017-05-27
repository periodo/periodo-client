"use strict";

const test = require('tape')

test('Period terminus helpers', t => {
  t.plan(4)

  const helpers = require('../items/terminus')
      , termini = require('./fixtures/termini.json')

  t.deepEqual(
    termini.map(helpers.getEarliestYear),
    [1200, 0, 501, -99, (new Date().getFullYear()), null],
    'should find smallest year in terminus'
  )

  t.deepEqual(
    termini.map(helpers.getLatestYear),
    [1200, 0, 600, -99, (new Date().getFullYear()), null],
    'should find largest year in terminus'
  )

  t.deepEqual(
    termini.map(helpers.hasISOValue),
    [true, true, true, true, true, false],
    'should detect whether a terminus has any ISO value'
  )

  t.deepEqual(
    termini.map(helpers.wasAutoparsed),
    [true, true, true, false, true, false],
    'should detect whether a terminus was autoparsed or not'
  )
})


test('Period terminus sequence helpers', t => {
  t.plan(2)

  const helpers = require('../items/terminus_seq')
      , termini = require('./fixtures/termini.json')

  t.deepEqual(
    helpers.maxYear(termini),
    { label: 'present', iso: (new Date().getFullYear()) },
    'should be able to find the latest terminus in a group'
  )


  t.deepEqual(
    helpers.minYear(termini),
    { label: 'one hundred bee cee', iso: -99 },
    'should be able to find the earliest terminus in a group'
  )
})


test('Period collection helpers', t => {
  t.plan(1)

  const helpers = require('../items/period_collection')
      , data = require('./fixtures/period-collection.json')

  t.deepEqual(helpers.describe(data.periodCollections.p03377f), {
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

test('Period collection sequence helpers', t => {
  t.plan(1);

  const helpers = require('../items/period_collection_seq');

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
    helpers.getSpatialCoverages(data),
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

  const helpers = require('../items/period');
  const multiLabelPeriod = require('./fixtures/multi-label-period.json');

  t.deepEqual(
    helpers.getOriginalLabel(multiLabelPeriod),
    {
      value: 'Progressive Era',
      language: 'eng',
      script: 'latn'
    }, 'should get original label from a period');


  t.deepEqual(
    helpers.getAllLabels(multiLabelPeriod),
    [
      { value: 'Progressive Era', language: 'eng', script: 'latn' },
      { value: 'The Progressive Era', language: 'eng', script: 'latn' },
      { value: 'Ère progressiste', language: 'fra', script: 'latn' },
    ], 'should get all labels from a period');


  t.deepEqual(
    helpers.getAlternateLabels(multiLabelPeriod),
    [
      { value: 'The Progressive Era', language: 'eng', script: 'latn' },
      { value: 'Ère progressiste', language: 'fra', script: 'latn' }
    ], 'should get only alternate labels from a period')
});
