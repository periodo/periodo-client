// vim: set filetype=javascript

{
  var bpBase = parseInt(options.bpBase || 1950);

  // Format a number to be ISO8601 compatible
  function zeroPadded(number) {
    var numberInt = parseInt(number)
      , numberStr = '' + Math.abs(numberInt)
      , sign = numberInt < 0 ? '-' : ''

    if (numberStr.length < 4) numberStr = ('0000' + numberStr).substr(-4, 4);

    return sign + numberStr;
  }

  function formatYear(type, value, label) {
    var ret = {
      _type: type,
      'in': { year: zeroPadded(value) }
    }
    if (label) ret.label = label;
    return ret;
  }

  function ADtoISO (year) { return parseInt(year) }
  function BCtoISO (year) { return -parseInt(year) + 1 }

  function formatRange(beginning, end) {
    var ret = { 'in': {} };
    if (beginning !== null) ret['in'].earliestYear = zeroPadded(beginning);
    if (end !== null) ret['in'].latestYear = zeroPadded(end);
    return ret;
  }


  // Create a range based on a century/millennium designation
  function makeEpoch(base, val, neg, modifier) {
    var adjust = Math.floor(base / 3)
      , earlyAdjust = adjust * (modifier ? modifier - 1 : 0)
      , lateAdjust = adjust * (modifier ? 3 - modifier : 0)
      , range
      , ret

    val = parseInt(val, 10) * base;

    range = neg ?
      [-val + 1 + earlyAdjust, -val + base - lateAdjust] :
      [val - (base - 1) + earlyAdjust, val - lateAdjust];

    ret = formatRange(range[0], range[1]);
    ret._type = 'gregorian';

    return ret;
  }
}

start = unclear? SPACE* ret:formats SPACE* {
  ret.label = text();
  return ret
}

formats = present / range / singleyear

present = 'present'i { return {label: 'present', _type: 'present'} };

// The formats that we accept
singleyear = 
  gregorianyear
  / bpyear
  / iso8601year

range =
  century
  / millennium
  / slashSeparatedRange

// Unclear prefixes
unclear =
  '~'
  / 'around'
  / 'circa'
  / 'about'
  / 'approximately'
  / 'ca.'i
  / 'ca'i
  / 'c.'i !'e'i
  / 'c'i !('.e'i / 'e'i)

slashSeparatedRange = 
  year1:digitsorquestionmark '/' year2:digitsorquestionmark SPACE* suffix:(bc / ad)
    {
      var fn = suffix.neg ? BCtoISO : ADtoISO
        , ret = formatRange(fn(year1), fn(year2))

      ret._type = 'gregorian';
      return ret;
    }
  / year1:simpleyear '/' year2:simpleyear
    {
      var ret = formatRange(year1, year2);
      ret._type = 'iso8601';
      return ret;
    }

simpleyear = sign:sign? digits:digitsorquestionmark { return (sign || '') + digits.join('') }

iso8601year = year:simpleyear { return formatYear('iso8601', year) }

gregorianyear =
  val:(
      year:digitsorquestionmark ' '* suffix:(bc / ad) { return { label: year, neg: suffix.neg } }
      / prefix:(bc / ad) ' '* year:digitsorquestionmark { return { label: year, neg: prefix.neg } }
  )
  {
    var year = val.neg ? BCtoISO(val.label) : ADtoISO(val.label);
    return formatYear('gregorian', year)
  }

bpyear =
  year:digitsorcomma SPACE* suffix:(bp)
  {
    var year = suffix.base - parseInt(year, 10);
    return formatYear('bp' + suffix.base, year, text());
  }

// Century / millennium stuff
early = ('early'i / 'beginning of the'i / 'beginning of'i / 'start of the'i) { return 1 }
middle = ('middle of the'i / 'mid'i) { return 2 }
late = ('late'i / 'end of the'i) { return 3 }

modifier = early / middle / late

century = modifier:modifier? SPACE* value:ordinal SPACE+ ('century'i / 'cent.' / 'cent') SPACE* suffix:(bc / ad)?
  { return makeEpoch(100, value, suffix ? suffix.neg : false, modifier) }


millennium = modifier:modifier? SPACE* value:ordinal SPACE+ 'millennium'i SPACE* suffix:(bc /ad)?
  { return makeEpoch(1000, value, suffix ? suffix.neg : false, modifier) }


// Constants
sign = '+' / '-'
digit = [0-9]
SPACE = ' '

digitsorcomma = 
  head:(onetothreedigits) tail:(',' ds:threedigits { return ds })+ { return head + tail.join('') }
  / manydigits

digitsorquestionmark = digitsorcomma '?'?

//head:digitsorcomma tail:('?')? { return { value: head + (tail || ''), approximate: !!tail } }

onetothreedigits = a:digit b:digit? c:digit? { return a + (b || '') + (c || '')}
threedigits = a:digit b:digit c:digit { return a + b + c }
fourdigits = a:digit b:digit c:digit d:digit { return a + b + c + d }
manydigits = digits:digit+ { return digits.join('') }

bp = 'c14 'i? 'b'i '.'? 'p'i '.'? base:(SPACE* digit+)? {
  return {
    label: text(),
    base: base ? parseInt(base[1].join('').trim(), 10) : bpBase
  }
}
bc = label:('b'i '.'? 'c'i '.'? e:(E:'e'i D:'.'? { return E + (D||'') })?) { return {label: label.join(''), neg: true} }
ad = label:('a'i '.'? 'd'i '.'? / 'c'i '.'? 'e'i '.'?) { return {label: label.join(''), neg: false} }


// ORDINAL NUMBERS
numericOrdinal = teenordinal / nonteenordinal

numFollowedByNum = val:digit &digit { return val }
ordinalhead = nums:numFollowedByNum* { return nums.join('') }
ordinaltail =
  val:([1]) suffix:'st'
  / val:([2]) suffix:'nd'
  / val:([3]) suffix:'rd'
  / val:([4567890]) suffix: 'th'

numFollowedByTwoNums = val:digit &(digit digit) { return val }
teenOrdinalHead = nums:numFollowedByTwoNums* { return nums.join('') }
teenOrdinalTail = val:('1' digit) 'th' { return val }

teenordinal = head:teenOrdinalHead tail:teenOrdinalTail { return parseInt(head + tail.join(''), 10) }
nonteenordinal = head:ordinalhead tail:ordinaltail { return parseInt(head + tail.join(''), 10) }


// Natural language ordinals
englishOrdinal =
  englishOrdinalAlone
  / head:englishOrdinalHead? mid:'-'? tail:englishOrdinalTail { return parseInt((head || 0) + tail, 10) }

englishOrdinalHead =
  'twenty'i { return 20 }
  / 'thirty'i { return 30 }
  / 'forty'i { return  40 }
  / 'fifty'i { return  50 }
  / 'sixty'i { return  60 }
  / 'seventy'i { return  70 }
  / 'eighty'i { return  80 }
  / 'ninety'i { return  90 }

englishOrdinalTail =
  'first'i { return  1 }
  / 'second'i { return  2 }
  / 'third'i { return  3 }
  / 'fourth'i { return  4 }
  / 'fifth'i { return  5 }
  / 'sixth'i { return  6 }
  / 'seventh'i { return  7 }
  / 'eighth'i { return  8 }
  / 'ninth'i { return  9 }

englishOrdinalAlone =
  'tenth'i { return  10 }
  / 'eleventh'i { return  11 }
  / 'twelfth'i { return  12 }
  / 'thirteenth'i { return  13 }
  / 'fourteenth'i { return  14 }
  / 'fifteenth'i { return  15 }
  / 'sixteenth'i { return  16 }
  / 'seventeenth'i { return  17 }
  / 'eighteenth'i { return  18 }
  / 'nineteenth'i { return  19 }
  / 'twentieth'i { return  20 }
  / 'thirtieth'i { return  30 }
  / 'fortieth'i { return  40 }
  / 'fiftieth'i { return  50 }
  / 'sixtieth'i { return  60 }
  / 'seventieth'i { return  70 }
  / 'eightieth'i { return  80 }
  / 'ninetieth'i { return  90 }

ordinal = englishOrdinal / numericOrdinal
