"use strict";

const h = require('react-hyperscript')
    , { SectionHeading, Section, Box } = require('periodo-ui')

module.exports = function IndexedDBMessage() {
  return [
    h(SectionHeading, {
      key: 'heading',
    }, 'Browser incompatible'),
    h(Section, {
      key: 'message',
    }, [
      h(Box, {
        as: 'p',
        mb: 3,
      }, [
        'Your browser does not support the ',
        h('a', {
          href: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API',
        }, 'IndexedDB'),
        ' standard, which PeriodO requires to operate. The most recent versions of all major Web browsers (Firefox, Safari, Chrome, Opera) all support IndexedDB. Please try another browser and reopen PeriodO.',
      ]),

      h(Box, {
        as: 'p',
        mb: 3,
      }, [
        '(Note: if you have opened PeriodO in a "private" or "incognito" tab, IndexedDB may not be available. If that is the case, reopen PeriodO in a normal tab).',
      ]),
    ]),
  ]
}
