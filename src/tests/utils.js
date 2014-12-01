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
      _type: 'iso8601',
      label: '1994',
      'in': { year: '1994' }
    });

    assert.deepEqual(parser.parse('-50000'), {
      _type: 'iso8601',
      label: '-50000',
      'in': { year: '-50000' }
    });

    // ISO8601 years without a +/- must be 4 digits.
    /*
    assert.throws(isoParser('4'), parser.SyntaxError);
    assert.throws(isoParser('500000000'), parser.SyntaxError);
    */

    // People didn't like the above constraint, so those are actually OK.
    assert.deepEqual(parser.parse('0043'), {
      _type: 'iso8601',
      label: '0043',
      'in': { year: '0043' }
    });
  });

  it('should parse valid Gregorian years', function () {
    var gregorianParser = typeParser.bind(null, 'gregorian');

    assert.deepEqual(parser.parse('12 A.D.'), {
      _type: 'gregorian',
      label: '12 A.D.',
      'in': { year: '0012' }
    });

    assert.deepEqual(parser.parse('12 bc'), {
      _type: 'gregorian',
      label: '12 bc',
      'in': { year: '-0011' }
    });

    assert.deepEqual(parser.parse('12 BCE'), {
      _type: 'gregorian',
      label: '12 BCE',
      'in': { year: '-0011' }
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
      _type: 'bp2000',
      label: '5 b.p.',
      'in': { year: '1995' }
    });

    assert.deepEqual(makeBPParser('2000 BP', 1950)(), {
      _type: 'bp1950',
      label: '2000 BP',
      'in': { year: '-0050' }
    });
  });
  
  it('should handle approximate dates', function () {
    assert.deepEqual(parser.parse('c. 5000 BCE'), {
      _type: 'gregorian',
      label: 'c. 5000 BCE',
      'in': { year: '-4999' },
    });

    assert.deepEqual(parser.parse('~800'), {
      _type: 'iso8601',
      label: '~800',
      'in': { year: '0800' },
    });

    assert.deepEqual(parser.parse('Ca. 12 AD'), {
      _type: 'gregorian',
      label: 'Ca. 12 AD',
      'in': { year: '0012' },
    });

    assert.deepEqual(parser.parse('3200? BC'), {
      _type: 'gregorian',
      label: '3200? BC',
      'in': { year: '-3199' },
    });
  });

  it('should handle descriptions of centuries or millenia', function () {
    assert.deepEqual(parser.parse('21st century'), {
      _type: 'gregorian',
      label: '21st century',
      'in': { earliestYear: '2001', latestYear: '2100' }
    });

    assert.deepEqual(parser.parse('21st century BC'), {
      _type: 'gregorian',
      label: '21st century BC',
      'in': { earliestYear: '-2099', latestYear: '-2000' }
    });

    assert.deepEqual(parser.parse('early 21st century'), {
      _type: 'gregorian',
      label: 'early 21st century',
      'in': { earliestYear: '2001', latestYear: '2034' }
    });

    assert.deepEqual(parser.parse('middle of the third century'), {
      _type: 'gregorian',
      label: 'middle of the third century',
      'in': { earliestYear: '0234', latestYear: '0267' }
    });
  });

  it('should handle date ranges', function () {
    assert.deepEqual(parser.parse('410/314 BCE'), {
      _type: 'gregorian',
      label: '410/314 BCE',
      'in': { earliestYear: '-0409', latestYear: '-0313' }
    });

    assert.deepEqual(parser.parse('1200/1400'), {
      _type: 'iso8601',
      label: '1200/1400',
      'in': { earliestYear: '1200', latestYear: '1400' }
    });
  });


  it('should throw errors for invalid dates', function () {
    function parse(val) { return parser.parse.bind(parser, val) }

    // No support for months (yet)
    assert.throws(parse('December 1945'), parser.SyntaxError);

    // No support for gibberish (yet)
    assert.throws(parse('afeopoij'), parser.SyntaxError);
  });

});

