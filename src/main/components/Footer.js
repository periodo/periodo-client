"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Text } = require('axs-ui')
    , version = require('../../../package.json').version
    , href = `https://github.com/periodo/periodo-client/tree/v${version}`


const Logo = ({ href, title, src, height=44 }) =>
  h(Box, { mt: 2 }, [
    h('a', { href }, [
      h('img', { title, src, height })
    ])
  ])


const Footer = ({ errors }) =>
  h(Flex, {
    justifyContent: 'space-between'
  }, [
    errors.size === 0 && h('div', ' '),

    errors.size > 0 && h('div', [
      h('h3', 'Errors'),

      h('pre', errors.map((err, i) =>
        `${i + 1} (${err.get('time').toISOString()})` +
        '\n=========\n' +
        (err.get('error').stack || err.get('error').toString()) +
        '\n\n'
      ).toArray())
    ]),

    h(Box, {
      css: {
        textAlign: 'right',
      }
    }, [
      h('span', [
        'PeriodO client ',
        h(Text, {
          color: 'blue',
          is: 'a',
          href,
          css: {
            textDecoration: 'none'
          }
        }, version)
      ]),

      Logo({
        href: 'http://perio.do/',
        title: 'PeriodO project',
        src: 'assets/periodo-logo.svg'
      }),

      Logo({
        href: 'http://imls.gov',
        title: 'Institute of Museum and Library Services',
        src: 'assets/imls_logo_2c.svg',
        height: 112
      }),

      Logo({
        href: 'http://neh.gov',
        title: 'National Endowment for the Humanities',
        src: 'assets/neh-logo.svg',
        height: 78 }),

    ])
  ])


module.exports = Footer;
