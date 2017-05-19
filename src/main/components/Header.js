"use strict";

const h = require('react-hyperscript')
    , RouterKnower = require('../../shared/components/router_knower')

const Header = props =>
  h('div .flex', [
    h('h1 .m0 .blue .regular .h2', [
      h('a .blue .text-decoration-none', { href: '/#/' }, 'PeriodO'),
    ]),

    h('a .ml1 .blue .text-decoration-none', {
      href: props.generateRoute('backend-select')
    }, '[select backend]')
  ])

module.exports = RouterKnower(Header);
