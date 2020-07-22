"use strict";

const test = require('blue-tape')
    , { parse, SyntaxError } = require('../')

const formatYear = (format, label, yearOrYears) => ({
  _type: format,
  label,
  'in': Array.isArray(yearOrYears)
    ? { earliestYear: yearOrYears[0], latestYear: yearOrYears[1] }
    : { year: yearOrYears }
})


test('Date parser (single dates)', async t => {
  t.plan(10)

  t.comment('-- ISO8601 --')

  t.deepEqual([
    parse('1994'),
    parse('-50000'),
    parse('0043'),
  ], [
    formatYear('iso8601', '1994', '1994'),
    formatYear('iso8601', '-50000','-50000'),
    formatYear('iso8601', '0043', '0043'),
  ], 'should parse valid ISO years')


  // ISO8601 years without a +/- must be 4 digits.
  // (People didn't like the above constraint, so those are actually OK.)
  // assert.throws(isoParser('4'), parser.SyntaxError);
  // assert.throws(isoParser('500000000'), parser.SyntaxError);

  t.comment('-- Gregorian --')

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
    () => parse('2014', { startRule: 'gregorianyear' }),
    SyntaxError,
    'should throw if Gregorian parse is not passed a suffix'
  );


  t.comment(' -- BP --')

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


  t.comment(' -- Approximate dates --')

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
    () => parse('asdlfkj'),
    SyntaxError,
    'should throw errors for invalid dates when specified'
  );
});


test('Date parser (ranges)', async t => {
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
    parse('1890s'),
    parse('late 1960s'),
    parse('middle of the 1200s'),
  ], [
    formatYear('gregorian', '1890s', ['1890', '1899']),
    formatYear('gregorian', 'late 1960s', ['1966', '1969']),
    formatYear('gregorian', 'middle of the 1200s', ['1203', '1206']),
  ], 'should handle descriptions of decades');

  t.deepEqual([
    parse('410/314 BCE'),
    parse('1200/1400'),
  ], [
    formatYear('gregorian', '410/314 BCE', ['-0409', '-0313']),
    formatYear('iso8601', '1200/1400', ['1200', '1400']),
  ], 'should handle "slashed" date ranges');

  t.deepEqual([
    parse('1800 or 1812'),
  ], [
    formatYear('iso8601', '1800 or 1812', ['1800', '1812']),
  ], 'should handle "or" dates');

})
