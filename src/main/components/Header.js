"use strict";

const h = require('react-hyperscript')
    , { Flex, Heading, Text } = require('axs-ui')
    , { RouterKnower } = require('lib/util/hoc')

const Header = props =>
  h(Flex, {
    alignItems: 'center',
  }, [
    h(Heading, {
      level: 1,
      m: 0,
      mr: 2,
      fontSize: 3,
      css: {
        fontWeight: 100
      }
    }, [
      h(Text, {
        is: 'a',
        href: '#/',
        color: 'blue',
        css: {
          textDecoration: 'none',
        }
      }, 'PeriodO')
    ]),

    h(Text, {
      is: 'a',
      ml: 1,
      color: 'blue',
      href: props.generateRoute('backend-select'),
      css: {
        textDecoration: 'none',
      }
    }, '[select backend]')
  ])

module.exports = RouterKnower(Header);
