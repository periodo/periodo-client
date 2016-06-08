"use strict";

const h = require('react-hyperscript')
    , version = require('../../../package.json').version
    , href = `https://github.com/periodo/periodo-client/tree/v${version}`


const Logo = ({ href, title, src, height=44 }) =>
  h('div .mt2', [
    h('a', { href }, [
      h('img', { title, src, height })
    ])
  ])


const Footer = () =>
  h('div .flex .justify-between', [
    h('div', ' '),

    h('div .right-align', [
      h('span', [
        'PeriodO client ',
        h('a .blue .text-decoration-none', { href }, version)
      ]),

      Logo({
        href: 'http://perio.do/',
        title: 'PeriodO project',
        src: 'lib/periodo-logo.svg'
      }),

      Logo({
        href: 'http://imls.gov',
        title: 'Institute of Museum and Library Services',
        src: 'lib/imls_logo_2c.svg',
        height: 112
      }),

      Logo({
        href: 'http://neh.gov',
        title: 'National Endowment for the Humanities',
        src: 'lib/neh-logo.svg',
        height: 78 }),

    ])
  ])


module.exports = Footer;
