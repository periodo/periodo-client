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
  = years

years
  = gregorianyear
  / bpyear
  / iso8601year

iso8601year =
  val:(sign:sign first:fourdigits rest:digit+ { return sign + first + rest.join('') }
        / sign:sign? digits:fourdigits { return (sign || '') + digits })
  {
    return formatReturn('iso8601', val, val)
  }

gregorianyear =
  val:(y:digitsorcomma ' '* suffix:(bc / ad) { return y + ' ' + suffix })
  {
    var neg = val.search('BC') !== -1;
    var yearInt = parseInt(val) * (neg ? -1 : 1) + (neg ? 1 : 0);
    return formatReturn('gregorian', val, yearInt);
  }

bpyear =
  val:(y:digitsorcomma ' '* suffix:(bp) { return y + ' ' + suffix })
  {
    var yearInt = bpBase - parseInt(val);
    return formatReturn('bp' + bpBase, val, yearInt)
  }

digitsorcomma = 
  head:(onetothreedigits) tail:(',' ds:threedigits { return ds })+ { return head + tail.join('') }
  / manydigits

// Constants
sign = '+' / '-'
digit = [0-9]

onetothreedigits = a:digit b:digit? c:digit? { return a + (b || '') + (c || '')}
threedigits = a:digit b:digit c:digit { return a + b + c }
fourdigits = a:digit b:digit c:digit d:digit { return a + b + c + d }
manydigits = digits:digit+ { return digits.join('') }

bp = 'b'i '.'? 'p'i '.'? { return 'BP' }
bc = b:'b'i '.'? c:'c'i '.'? e:('e'i '.'?)? { return 'BC' }
ad = 'a'i '.'? 'd'i '.'? { return 'AD' }
