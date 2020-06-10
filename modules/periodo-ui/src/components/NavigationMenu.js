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
    variant: 'menu',
    className: 'navigation-menu',
    ...props,
  }, routeGroups.map(({ label, routes }, i) =>
    h(Box, {
      key: i,
      sx: {
        minWidth: 180,
        px: 2,
        py: 1,
      },
    }, [
      h(Heading, {
        key: 'heading' + '-i',
        level: 2,
        fontSize: 1,
      }, label),
    ].concat(routes.map(({ route, label }) => {
      const isActive = route.resourceName === activeResource.name
      return h(Link, {
        display: 'block',
        ['data-active']: isActive,
        key: route.resourceName,
        route,
      }, label)
    })))
  ))
