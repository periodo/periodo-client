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
      label: '1994',
      isoValue: '+1994'
    });

    assert.deepEqual(parser.parse('-50000'), {
      type: 'iso8601',
      label: '-50000',
      isoValue: '-50000'
    });

    // ISO8601 years without a +/- must be 4 digits.
    /*
    assert.throws(isoParser('4'), parser.SyntaxError);
    assert.throws(isoParser('500000000'), parser.SyntaxError);
    */

    // People didn't like the above constraint, so those are actually OK.
    assert.deepEqual(parser.parse('43'), {
      type: 'iso8601',
      label: '43',
      isoValue: '+0043'
    });
  });

  it('should parse valid Gregorian years', function () {
    var gregorianParser = typeParser.bind(null, 'gregorian');

    assert.deepEqual(parser.parse('12 A.D.'), {
      type: 'gregorian',
      label: '12 A.D.',
      isoValue: '+0012'
    });

    assert.deepEqual(parser.parse('12 bc'), {
      type: 'gregorian',
      label: '12 bc',
      isoValue: '-0011'
    });

    assert.deepEqual(parser.parse('12 BCE'), {
      type: 'gregorian',
      label: '12 BCE',
      isoValue: '-0011'
    });

    assert.deepEqual(parser.parse('12 bc').value, parser.parse('12 B.C.').value);
    assert.deepEqual(parser.parse('12 bc').value, parser.parse('12 b.c.e.').value);

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
      label: '5 b.p.',
      isoValue: '+1995'
    });

    assert.deepEqual(makeBPParser('2000 BP', 1950)(), {
      type: 'bp1950',
      label: '2000 BP',
      isoValue: '-0050'
    });
  });
  
  it('should handle approximate dates', function () {
    assert.deepEqual(parser.parse('c. 5000 BCE'), {
      type: 'gregorian',
      label: 'c. 5000 BCE',
      isoValue: '-4999',
      approximate: true
    });

    assert.deepEqual(parser.parse('~800'), {
      type: 'iso8601',
      label: '~800',
      isoValue: '+0800',
      approximate: true
    });

    assert.deepEqual(parser.parse('Ca. 12 AD'), {
      type: 'gregorian',
      label: 'Ca. 12 AD',
      isoValue: '+0012',
      approximate: true
    });

    assert.deepEqual(parser.parse('3200? BC'), {
      type: 'gregorian',
      label: '3200? BC',
      isoValue: '-3199',
      approximate: true
    });
  });

  it('should handle descriptions of centuries or millenia', function () {
  });

  it('should handle date ranges', function () {
  });


  it('should throw errors for invalid dates', function () {
    function parse(val) { return parser.parse.bind(parser, val) }

    // No support for months (yet)
    assert.throws(parse('December 1945'), parser.SyntaxError);

    // No support for gibberish (yet)
    assert.throws(parse('afeopoij'), parser.SyntaxError);
  });

});

