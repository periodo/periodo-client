"use strict";

const test = require('tape')
    , Immutable = require('immutable')


const parse = require('../utils/date_parser')

const formatYear = (format, label, yearOrYears) => ({
  _type: format,
  label,
  'in': Array.isArray(yearOrYears)
    ? { earliestYear: yearOrYears[0], latestYear: yearOrYears[1] }
    : { year: yearOrYears }
})


test('Date parser (single dates)', t => {
  t.plan(11)

  t.comment('## ISO8601')

  t.deepEqual([
    parse('1994'),
    parse('-50000'),
    parse('0043'),
  ], [
    formatYear('iso8601', '1994', '1994'),
    formatYear('iso8601', '-50000','-50000'),
    formatYear('iso8601', '0043', '0043'),
  ], 'should parse valid ISO years')


  /*
  // ISO8601 years without a +/- must be 4 digits.
  // (People didn't like the above constraint, so those are actually OK.)
  assert.throws(isoParser('4'), parser.SyntaxError);
  assert.throws(isoParser('500000000'), parser.SyntaxError);
  */

  t.comment('## Gregorian')

  t.deepEqual([
    parse('12 A.D.'),
    parse('12 bc'),
    parse('12 BCE'),
  ], [
    formatYear('gregorian', '12 A.D.', '0012'),
    formatYear('gregorian', '12 bc', '-0011'),
    formatYear('gregorian', '12 BCE', '-0011'),
  ], 'should parse valid Gregorian years')

  t.deepEqual([
    parse('12 bc').value,
    parse('12 bc').value
  ], [
    parse('12 B.C.').value,
    parse('12 b.c.e.').value,
  ], 'should normalize AD/BC(E) labels')

  t.throws(
    () => parse('2014', { startRule: 'gregorianyear', throw: true  }),
    parse._parser.SyntaxError,
    'should throw if Gregorian parse is not passed a suffix'
  );


  t.comment('## BP')

  t.deepEqual(
    parse('5 b.p.'),
    formatYear('bp1950', '5 b.p.', '1945'),
    'should parse valid BP years, assuming base of 1950.'
  );

  t.deepEqual(
    parse('2000 BP', { bpBase: 2000 }),
    formatYear('bp2000', '2000 BP', '0000'),
    'should allow BP base to be configured in a parser option.'
  )

  t.deepEqual(
    parse('5 BP2000'),
    formatYear('bp2000', '5 BP2000', '1995'),
    'should intuit BP base if provided in the parsed string'
  );


  t.comment('## Approximate dates')

  t.deepEqual([
    parse('c. 5000 BCE'),
    parse('~800'),
    parse('Ca. 12 AD'),
    parse('circa 1000 BC'),
    parse('3200? BC'),
  ], [
    formatYear('gregorian', 'c. 5000 BCE', '-4999'),
    formatYear('iso8601', '~800', '0800'),
    formatYear('gregorian', 'Ca. 12 AD', '0012'),
    formatYear('gregorian', 'circa 1000 BC', '-0999'),
    formatYear('gregorian', '3200? BC', '-3199'),
  ], 'should handle approximate dates');

  t.deepEqual(
    parse('present'),
    { _type: 'present', label: 'present' },
    "should accept 'present' as a valid date"
  );

  t.throws(
    () => parse('asdlfkj', { throw: true }),
    parse._parser.SyntaxError,
    'should throw errors for invalid dates when specified'
  );

  t.equal(
    parse('asdlfkj'),
    null,
    'should return null for invalid dates by default'
  )
});


test('Date parser (ranges)', t => {
  t.plan(2);

  t.deepEqual([
    parse('21st century'),
    parse('21st century BC'),
    parse('early 21st century'),
    parse('middle of the third century'),
    parse('First century BC'),
  ], [
    formatYear('gregorian', '21st century', ['2001', '2100']),
    formatYear('gregorian', '21st century BC', ['-2099', '-2000']),
    formatYear('gregorian', 'early 21st century', ['2001', '2034']),
    formatYear('gregorian', 'middle of the third century', ['0234', '0267']),
    formatYear('gregorian', 'First century BC', ['-0099', '0000']),
  ], 'should handle descriptions of centuries or millenia');

  t.deepEqual([
    parse('410/314 BCE'),
    parse('1200/1400'),
  ], [
    formatYear('gregorian', '410/314 BCE', ['-0409', '-0313']),
    formatYear('iso8601', '1200/1400', ['1200', '1400']),
  ], 'should handle "slashed" date ranges');

})


test('Patch utils', t => {

  t.plan(6);

  const { makePatch } = require('../utils/patch')
      , data = Immutable.fromJS(require('./data/period-collection.json'))

  const samplePatches = {
    addPeriod: {
      op: 'add',
      path: '/periodCollections/a/definitions/b'
    },
    removePeriod: {
      op: 'remove',
      path: '/periodCollections/a/definitions/b'
    },
    changePeriod: {
      op: 'add',
      path: '/periodCollections/a/definitions/b/note'
    }
  }

  t.deepEqual(
    makePatch(data.toJS(), data.toJS()),
    [],
    'should not detect any changes between two identical datasets'
  );


  const { groupByChangeType } = require('../helpers/patch_collection')
      , patches = Immutable.fromJS(samplePatches).toList()

  t.deepEqual(groupByChangeType(patches).toJS(), {
    addPeriod: {
      a: [samplePatches.addPeriod]
    },
    removePeriod: {
      a: [samplePatches.removePeriod]
    },
    editPeriod: {
      a: {
        b: [samplePatches.changePeriod]
      }
    }
  }, 'should group patches together');


  const attrPath = ['periodCollections', 'p03377f', 'source']
      , newData = data.setIn(attrPath.concat('yearPublished'), '1900')
      , patch = makePatch(data.toJS(), newData.toJS())

  t.deepEqual(patch, [
    {
      op: 'add',
      path: '/' + attrPath.join('/'),
      value: newData.getIn(attrPath).toJS()
    }
  ], 'should use "add" operation for simple values instead of "replace"');


  const attrPath2 = ['periodCollections', 'p03377f', 'definitions', 'p03377fkhrv', 'spatialCoverage']

  const newData2 = data.updateIn(attrPath2, sc => {
    return sc.unshift(Immutable.Map({ id: 'http://example.com/', label: 'New country' }));
  });

  const patch2 = makePatch(data.toJS(), newData2.toJS());

  t.deepEqual(patch2, [
    {
      op: 'add',
      path: '/' + attrPath2.join('/'),
      value: newData2.getIn(attrPath2).toJS()
    }
  ], 'should use "add" operation for complex values instead of "replace"');


  const { classifyPatch, parsePatchPath } = require('../utils/patch')
      , { patchTypes } = require('../types')

  t.deepEqual([
    classifyPatch(samplePatches.addPeriod),
    classifyPatch(samplePatches.removePeriod),
    classifyPatch(samplePatches.changePeriod),
  ], [
    [patchTypes.CREATE_PERIOD, 'Created period b in collection a.'],
    [patchTypes.DELETE_PERIOD, 'Deleted period b in collection a.'],
    [patchTypes.EDIT_PERIOD, 'Changed note of period b in collection a.'],
  ], 'should classify patch paths');


  t.deepEqual([
    parsePatchPath(samplePatches.addPeriod),
    parsePatchPath(samplePatches.removePeriod),
    parsePatchPath(samplePatches.changePeriod),
    parsePatchPath({ path: '/periodCollections/abc/definitions/def/spatialCoverageDescription' }),
  ], [
    {
      label: null,
      type: 'period',
      collection_id: 'a',
      id: 'b',
    },
    {
      label: null,
      type: 'period',
      collection_id: 'a',
      id: 'b',
    },
    {
      label: 'note',
      type: 'period',
      collection_id: 'a',
      id: 'b'
    },
    {
      label: 'spatialCoverageDescription',
      type: 'period',
      collection_id: 'abc',
      id: 'def'
    },
  ], 'should parse information from patch paths');

  /*
  t.throws(
    () => parsePatchPath({
      op: 'add',
      path: '/periodCollections/a/definitions/b/madeUpField'
    }),
    new Error('Invalid field for a period: madeUpField'),
    'Should throw when attempting to parse invalid patch path.'
  );
  */
});
