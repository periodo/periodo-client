/* eslint-disable */
"use strict";

const test = require('blue-tape')
    , util = require('../')
    , { symbols } = util


test('Period terminus utility functions', async t => {
  t.plan(8)

  const termini = require('./fixtures/termini.json')

  t.deepEqual(
    termini.map(util.terminus.earliestYear),
    [ 1200, 0, 501, -99, (new Date().getFullYear()), null ],
    'should find smallest year in terminus'
  )

  t.deepEqual(
    termini.map(util.terminus.latestYear),
    [ 1200, 0, 600, -99, (new Date().getFullYear()), null ],
    'should find largest year in terminus'
  )

  t.deepEqual(
    termini.map(util.terminus.hasISOValue),
    [ true, true, true, true, true, false ],
    'should detect whether a terminus has any ISO value'
  )

  const unpaddedISOYearTerminus = { in: { year: '30' }}
  util.terminus.ensureISOYear(unpaddedISOYearTerminus)

  t.deepEqual(
    unpaddedISOYearTerminus,
    { in: { year: '0030' }},
    'should fix invalid ISO years having less than 4 numbers'
  )

  const extraspacedISOYearTerminus = { in: { year: '- 1000' }}
  util.terminus.ensureISOYear(extraspacedISOYearTerminus)

  t.deepEqual(
    extraspacedISOYearTerminus,
    { in: { year: '-1000' }},
    'should fix invalid ISO years having extraneous spaces'
  )

  t.deepEqual(
    termini.map(util.terminus.wasAutoparsed),
    [ true, true, true, false, true, false ],
    'should detect whether a terminus was autoparsed or not'
  )

  t.ok(
    util.terminus.isMultipart({
      label: '200/300',
      in: {
        earliestYear: '200',
        latestYear: '300',
      },
    }),
    'should detect multipart dates')

  t.notOk(
    util.terminus.isMultipart({
      label: '200',
      in: { year: '200' },
    }),
    'should detect single part dates')
})


test('Period terminus sequence utility functions', async t => {
  t.plan(2)

  const termini = require('./fixtures/termini.json')

  t.deepEqual(
    util.terminusList.maxYear(termini),
    {
      label: 'present',
      iso: (new Date().getFullYear()),
    },
    'should be able to find the latest terminus in a group'
  )


  t.deepEqual(
    util.terminusList.minYear(termini),
    {
      label: 'one hundred bee cee',
      iso: -99,
    },
    'should be able to find the earliest terminus in a group'
  )
})


test('Period authority utility functions', async t => {
  t.plan(1)

  const data = require('./fixtures/authority.json')

  t.deepEqual(util.authority.describe(data.authorities.p03377f), {
    id: 'p03377f',
    source: 'Ruiz, Arturo. The archaeology of the Iberians. 1998.',
    periods: 2,
    earliest: {
      iso: -799,
      label: '800 B.C.',
    },
    latest: {
      iso: -205,
      label: '206 B.C.',
    },
    editorialNote: '',
  }, 'should describe an authority')
});

test('Authority sequence utility functions', async t => {
  t.plan(4);

  const data = [
    {
      periods: [
        {
          spatialCoverageDescription: 'Middle East',
          spatialCoverage: [
            { id: 'a' },
          ],
        },
      ],
    },
    {
      periods: [
        {
          spatialCoverageDescription: 'Middle East',
          spatialCoverage: [
            { id: 'a' },
          ],
        },
      ],
    },
    {
      periods: [
        {
          spatialCoverageDescription: 'Middle East',
          spatialCoverage: [
            { id: 'a' },
            { id: 'b' },
          ],
        },
      ],
    },
    {
      periods: [
        {
          spatialCoverageDescription: 'Middle East 2',
          spatialCoverage: [
            { id: 'a' },
          ],
        },
      ],
    },
  ];

  t.equal(
    util.authorityList.periods(data)[0][symbols.$$Authority],
    data[0],
    'should associate periods with authorities via the $$Authority symbol.'
  )

  const a = util.authorityList.periods(data)
      , b = util.authorityList.periods(data)

  t.notEqual(a[0], b[0], 'periods should not be strictly equivalent')
  t.equal(
    util.period.periodWithAuthority(a[0]).period,
    util.period.periodWithAuthority(b[0]).period,
    'but should contain references that can use strict equivalence'
  )


  t.deepEqual(
    util.authorityList.spatialCoverages(data),
    [
      {
        label: 'Middle East',
        uses: [
          {
            count: 2,
            countries: [ 'a' ],
          },
          {
            count: 1,
            countries: [ 'a', 'b' ],
          },
        ],
      },
      {
        label: 'Middle East 2',
        uses: [
          {
            count: 1,
            countries: [ 'a' ],
          },
        ],
      },
    ], 'Should group spatial coverage collections');
});


test('Multi label periods', async t => {
  t.plan(3)

  const multiLabelPeriod = require('./fixtures/multi-label-period.json');

  t.deepEqual(
    util.period.originalLabel(multiLabelPeriod),
    {
      label: 'Progressive Era',
      languageTag: 'en',
    }, 'should get original label from a period');


  t.deepEqual(
    util.period.allLabels(multiLabelPeriod),
    [
      {
        label: 'Progressive Era',
        languageTag: 'en',
      },
      {
        label: 'The Progressive Era',
        languageTag: 'en',
      },
      {
        label: 'Ère progressiste',
        languageTag: 'fr',
      },
    ], 'should get all labels from a period');


  t.deepEqual(
    util.period.alternateLabels(multiLabelPeriod),
    [
      {
        label: 'The Progressive Era',
        languageTag: 'en',
      },
      {
        label: 'Ère progressiste',
        languageTag: 'fr',
      },
    ], 'should get only alternate labels from a period')
});
