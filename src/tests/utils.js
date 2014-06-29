"use strict";

var assert = require('assert')

describe('Date parser', function () {
  var parser = require('../utils/date_parser');

  // Returns a function that, when called, will try to parse `val` as `type`
  function typeParser(type, val) {
    var options = { 'startRule': type + 'year' };
    return parser.parse.bind(parser, val, options)
  }

  it('should parse valid ISO years', function () {
    var isoParser = typeParser.bind(null, 'iso8601');

    assert.deepEqual(parser.parse('1994'), {
      type: 'iso8601',
      value: '1994',
      isoValue: '+1994'
    });

    assert.deepEqual(parser.parse('-50000'), {
      type: 'iso8601',
      value: '-50000',
      isoValue: '-50000'
    });

    // ISO8601 years without a +/- must be 4 digits.
    assert.throws(isoParser('4'), parser.SyntaxError);
    assert.throws(isoParser('500000000'), parser.SyntaxError);
  });

  it('should parse valid Gregorian years', function () {
    var gregorianParser = typeParser.bind(null, 'gregorian');

    assert.deepEqual(parser.parse('12 a.d.'), {
      type: 'gregorian',
      value: '12 AD',
      isoValue: '+0012'
    });

    assert.deepEqual(parser.parse('12 b.c.'), {
      type: 'gregorian',
      value: '12 BC',
      isoValue: '-0011'
    });

    assert.deepEqual(parser.parse('12 bc'), parser.parse('12 B.C.'));
    assert.deepEqual(parser.parse('12 bc'), parser.parse('12 b.c.e.'));

    // Gregorian years must have BC or AD
    assert.throws(gregorianParser('2014'), parser.SyntaxError);
  });

  it('should parse valid BP years', function () {
    function makeBPParser(val, base) {
      return parser.parse.bind(parser, val, {
        startRule: 'bpyear',
        bpBase: base
      });
    }
    assert.deepEqual(parser.parse('5 b.p.'), {
      type: 'bp2000',
      value: '5 BP',
      isoValue: '+1995'
    });

    assert.deepEqual(makeBPParser('2000 BP', 1950)(), {
      type: 'bp1950',
      value: '2000 BP',
      isoValue: '-0050'
    });
  });

  it('should throw errors for invalid dates', function () {
    function parse(val) { return parser.parse.bind(parser, val) }

    // No support for months (yet)
    assert.throws(parse('December 1945'), parser.SyntaxError);

    // No support for uncertainity (yet)
    assert.throws(parse('c. 134 AD'), parser.SyntaxError);
    assert.throws(parse('1364?'), parser.SyntaxError);

    // No support for gibberish (yet)
    assert.throws(parse('afeopoij'), parser.SyntaxError);
  });

});

