"use strict";

const h = require('react-hyperscript')
    , { SectionHeading, Section, Text, Link } = require('periodo-ui')

module.exports = function About() {
  return (
    h('div', [
      h(SectionHeading, 'About'),

      h(Section, [
        h(Text, {
          fontSize: 2,
          mb: 3,
        }, [
          'PeriodO is a gazetteer of scholarly definitions of time periods. See the ',
          h(Link, {
            href: 'https://perio.do/',
          }, 'project homepage'),
          ' for more information.',
        ]),

        h(Text, {
          fontSize: 2,
          mb: 3,
        }, [
          'You are using the Web client for browsing and editing period definitions. There is a ',
          h(Link, {
            href: 'http://perio.do/guide/',
          }, 'guide'),
          ' available to assist in navigating this application.',
        ]),

        h(Text, {
          fontSize: 2,
          mb: 3,
        }, [
        ]),
      ]),
    ])
  )
}
