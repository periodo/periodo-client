"use strict";

const h = require('react-hyperscript')

const Header = () =>
  h('div .flex', [
    h('h1 .m0 .blue .regular .h2', [
      h('a .blue .text-decoration-none', { href: '/#/' }, 'PeriodO')
    ])
  ])

module.exports = Header;
