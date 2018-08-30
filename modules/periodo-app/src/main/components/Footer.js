"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Link } = require('periodo-ui')
   , version = require('../../../../../package.json').version
   , href = `https://github.com/periodo/periodo-client/tree/v${version}`


const Logo = ({ href, title, src, height=44 }) =>
  h(Box, {}, [
    h('a', { href }, [
      h('img', { title, src, height })
    ])
  ])

const Footer = props =>
  h(Box.withComponent('footer'), props, [
    h(Flex, {
      justifyContent: 'space-around',
      alignItems: 'center',
    }, [
      h(Logo, {
        href: 'http://imls.gov',
        title: 'Institute of Museum and Library Services',
        src: 'images/imls_logo_2c.svg',
        height: 80
      }),

      h(Box, [
        h(Logo, {
          href: 'http://neh.gov',
          title: 'National Endowment for the Humanities',
          src: 'images/neh-logo.svg',
          height: 60
        }),

        h(Box, { mt: 2, align: 'right' }, [
          'Client version ',
          h(Link, { href }, version)
        ]),
      ]),
    ]),

  ])

/*
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

    h(Flex, {
    }, [
      Logo({
        href: 'http://imls.gov',
        title: 'Institute of Museum and Library Services',
        src: 'images/imls_logo_2c.svg',
        height: 112
      }),

      Logo({
        href: 'http://neh.gov',
        title: 'National Endowment for the Humanities',
        src: 'images/neh-logo.svg',
        height: 78 }),

    ])
  ])
*/


module.exports = Footer;
