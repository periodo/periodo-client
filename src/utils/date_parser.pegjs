// vim: set filetype=javascript

{
  var bpBase = parseInt(options.bpBase || 2000);

  function zeroPadded(number) {
    var numberInt = parseInt(number)
      , numberStr = '' + Math.abs(numberInt)
      , sign = numberInt < 0 ? '-' : '+'

    if (numberStr.length < 4) numberStr = ('0000' + numberStr).substr(-4, 4);

    return sign + numberStr;
  }

  function formatReturn(type, label, isoValue) {
    return { type: type, label: label, isoValue: zeroPadded(isoValue) }
  }
}

start
  = approx:unclear? ret:years {
    if (approx) {
      ret.approximate = true;
      ret.label = approx + ret.label;
    }

    return ret;
  }

years
  = gregorianyear
  / bpyear
  / fakeiso8601year

unclear = label:('~' / 'around' / 'ca.'i / 'ca'i / 'c.'i / 'c'i) space:' '? { return label + (space || '') }

iso8601year =
  val:(sign:sign first:fourdigits rest:digit+ { return sign + first + rest.join('') }
        / sign:sign? digits:fourdigits { return (sign || '') + digits })
  {
    return formatReturn('iso8601', val, val)
  }

fakeiso8601year =
  sign:sign? digits:digitsorquestionmark
    {
      var value = (sign || '') + digits.value;
      var ret = formatReturn('iso8601', value, value);
      if (digits.approximate) ret.approximate = true;
      return ret;
    }

gregorianyear =
  val:(
      y:digitsorquestionmark ' '* suffix:(bc / ad) 
        { return { label: y.value + ' ' + suffix.label, neg: suffix.neg, approximate: y.approximate } }
      / prefix:(bc / ad) ' '* y:digitsorquestionmark
        { return { label: y.value + ' ' + prefix.label, neg: prefix.neg, approximate: y.approximate } }
  )
  {
    var yearInt = parseInt(val.label) * (val.neg ? -1 : 1) + (val.neg ? 1 : 0);
    var ret = formatReturn('gregorian', val.label, yearInt);
    if (val.approximate) ret.approximate = true;
    return ret;
  }

bpyear =
  val:(y:digitsorcomma ' '* suffix:(bp) { return y + ' ' + suffix.join('') })
  {
    var yearInt = bpBase - parseInt(val);
    return formatReturn('bp' + bpBase, val, yearInt)
  }

digitsorcomma = 
  head:(onetothreedigits) tail:(',' ds:threedigits { return ds })+ { return head + tail.join('') }
  / manydigits

digitsorquestionmark =
  head:digitsorcomma tail:('?')? { return { value: head + (tail || ''), approximate: !!tail } }

// Constants
sign = '+' / '-'
digit = [0-9]

onetothreedigits = a:digit b:digit? c:digit? { return a + (b || '') + (c || '')}
threedigits = a:digit b:digit c:digit { return a + b + c }
fourdigits = a:digit b:digit c:digit d:digit { return a + b + c + d }
manydigits = digits:digit+ { return digits.join('') }

bp = 'b'i '.'? 'p'i '.'?
bc = label:('b'i '.'? 'c'i '.'? e:(E:'e'i D:'.'? { return E + (D||'') })?) { return {label: label.join(''), neg: true} }
ad = label:('a'i '.'? 'd'i '.'? / 'c'i '.'? 'e'i '.'?) { return {label: label.join(''), neg: false} }
