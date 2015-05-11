"use strict";

var assert = require('assert')

describe('Date parser', function () {
  var parse = require('../utils/date_parser')

  it('should parse valid ISO years', function () {
    assert.deepEqual(parse('1994'), {
      _type: 'iso8601',
      label: '1994',
      'in': { year: '1994' }
    });

    assert.deepEqual(parse('-50000'), {
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
    assert.deepEqual(parse('0043'), {
      _type: 'iso8601',
      label: '0043',
      'in': { year: '0043' }
    });
  });

  it('should parse valid Gregorian years', function () {
    function gregorianParser(val) {
      return parse(val, { startRule: 'gregorianyear', throw: true });
    }

    assert.deepEqual(parse('12 A.D.'), {
      _type: 'gregorian',
      label: '12 A.D.',
      'in': { year: '0012' }
    });

    assert.deepEqual(parse('12 bc'), {
      _type: 'gregorian',
      label: '12 bc',
      'in': { year: '-0011' }
    });

    assert.deepEqual(parse('12 BCE'), {
      _type: 'gregorian',
      label: '12 BCE',
      'in': { year: '-0011' }
    });

    assert.deepEqual(parse('12 bc').value, parse('12 B.C.').value);
    assert.deepEqual(parse('12 bc').value, parse('12 b.c.e.').value);

    // Gregorian years must have BC or AD
    assert.throws(gregorianParser.bind(null, '2014'), parse._parser.SyntaxError);
  });

  it('should parse valid BP years', function () {
    function bpParse(val, base) {
      return parse(val, { startRule: 'bpyear', bpBase: base, throw: true  });
    }

    assert.deepEqual(parse('5 b.p.'), {
      _type: 'bp1950',
      label: '5 b.p.',
      'in': { year: '1945' }
    });

    assert.deepEqual(bpParse('2000 BP', 2000), {
      _type: 'bp2000',
      label: '2000 BP',
      'in': { year: '0000' }
    });

    assert.deepEqual(parse('5 BP2000'), {
      _type: 'bp2000',
      label: '5 BP2000',
      'in': { year: '1995' }
    });
  });
  
  it('should handle approximate dates', function () {
    assert.deepEqual(parse('c. 5000 BCE'), {
      _type: 'gregorian',
      label: 'c. 5000 BCE',
      'in': { year: '-4999' },
    });

    assert.deepEqual(parse('~800'), {
      _type: 'iso8601',
      label: '~800',
      'in': { year: '0800' },
    });

    assert.deepEqual(parse('Ca. 12 AD'), {
      _type: 'gregorian',
      label: 'Ca. 12 AD',
      'in': { year: '0012' },
    });

    assert.deepEqual(parse('3200? BC'), {
      _type: 'gregorian',
      label: '3200? BC',
      'in': { year: '-3199' },
    });
  });

  it('should handle descriptions of centuries or millenia', function () {
    assert.deepEqual(parse('21st century'), {
      _type: 'gregorian',
      label: '21st century',
      'in': { earliestYear: '2001', latestYear: '2100' }
    });

    assert.deepEqual(parse('21st century BC'), {
      _type: 'gregorian',
      label: '21st century BC',
      'in': { earliestYear: '-2099', latestYear: '-2000' }
    });

    assert.deepEqual(parse('early 21st century'), {
      _type: 'gregorian',
      label: 'early 21st century',
      'in': { earliestYear: '2001', latestYear: '2034' }
    });

    assert.deepEqual(parse('middle of the third century'), {
      _type: 'gregorian',
      label: 'middle of the third century',
      'in': { earliestYear: '0234', latestYear: '0267' }
    });

    assert.deepEqual(parse('First century BC'), {
      _type: 'gregorian',
      label: 'First century BC',
      'in': { earliestYear: '-0099', latestYear: '0000'}
    });
  });

  it('should handle date ranges', function () {
    assert.deepEqual(parse('410/314 BCE'), {
      _type: 'gregorian',
      label: '410/314 BCE',
      'in': { earliestYear: '-0409', latestYear: '-0313' }
    });

    assert.deepEqual(parse('1200/1400'), {
      _type: 'iso8601',
      label: '1200/1400',
      'in': { earliestYear: '1200', latestYear: '1400' }
    });
  });

  it('should accept \'present\'', function () {
    assert.deepEqual(parse('present'), {
      _type: 'present',
      label: 'present'
    });
  });


  it('should throw errors for invalid dates only when asked', function () {
    // No support for months (yet)
    assert.throws(parse.bind(null, 'December 1945', { throw: true }), parse._parser.SyntaxError);
    assert.equal(parse('December 1945'), null);

    // No support for gibberish (yet)
    assert.throws(parse.bind(null, 'afeopoij', { throw: true }), parse._parser.SyntaxError);
    assert.equal(parse('afeopoij'), null);
  });

});

