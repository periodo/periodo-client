# PeriodO date parser
Natural language date parsing for historical time periods.

# Supported year formats

  * [Before Present](https://en.wikipedia.org/wiki/Before_Present)

    Example: *2000BP*

  * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)

    Example: *5000*

  * [Gregorian](https://en.wikipedia.org/wiki/Gregorian_calendar)

    Example: *1917AD*, *1200BCE*

  * Approximate dates

    Example: *1200B.C.*, *ca. 1923*

  * Date ranges

    Example: *21st century*, *early 14th century*, *1200/1400*

# Example

```javascript
const parser = require('periodo-date-parser')

// throws parser.SyntaxError if unsuccessful
console.log(parser.parse('200 AD'));
// { _type: 'gregorian', in: { year: '0200' }, label: '200 AD' }

console.log(parser.parse('middle of the 21st century'));
// { _type: 'gregorian',
//   in: { earliestYear: '2034', latestYear: '2067' },
//   label: 'middle of the 21st century' }
```
