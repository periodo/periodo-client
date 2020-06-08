"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Heading } = require('./Base')
    , { Link } = require('./Links')

exports.NavigationMenu = ({
  activeResource,
  routeGroups,
  ...props
}) =>
  h(Flex, {
    sx: {
      py: 2,
      px: 3,
      bg: 'white',
    },
    ...props,
  }, routeGroups.map(({ label, routes }, i) =>
    h(Box, {
      key: i,
      sx: {
        minWidth: 180,
        px: 2,
        py: 1,
        '& [data-active="true"]::before': {
          content: '"▸"',
          position: 'absolute',
          marginTop: '-1px',
          marginLeft: '-11px',
          color: 'orangered',
        },
      },
    }, [
      h(Heading, {
        key: 'heading' + '-i',
        level: 2,
        fontSize: 2,
      }, label),
    ].concat(routes.map(({ route, label }) => {
      const isActive = route.resourceName === activeResource.name
      return h(Link, {
        display: 'block',
        ['data-active']: isActive,
        color: `blue.${ isActive ? 8 : 4 }`,
        key: route.resourceName,
        route,
      }, label)
    })))
  ))
