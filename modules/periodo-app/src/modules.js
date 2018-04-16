"use strict";

const h = require('react-hyperscript')
    , Type = require('union-type')
    , R = require('ramda')
    , { combineReducers } = require('redux')
    , { Box, Flex } = require('axs-ui')
    , { Breadcrumb, DropdownMenu } = require('periodo-ui')
    , modules = new Map()

let resources
  , reducer


const Module = Type({ Module: {
  reducer: x => x === undefined || typeof x === 'function',
  resources: x => x === undefined || typeof x === 'object',
}})


register('backends', require('./backends'));
register('main', require('./main'));

// register('auth', require('./auth'))
// register('ld', require('./ld'))
// register('patches', require('./patches'))


function register(ns, mod) {
  modules.set(ns, Module.ModuleOf(mod))
}

function makeResourceComponent(resource) {
  const { makeBreadcrumb, makeActionMenu } = resource

  const Resource = props => {
    const menuChildren = []

    if (makeActionMenu) {
      menuChildren.push(h(DropdownMenu, {
        id: 'action-menu',
        // focusMenu: true,
        label: resource.actionMenuTitle || 'Actions',
      }, makeActionMenu(props)))
    }

    if (makeBreadcrumb) {
      menuChildren.push(h(Breadcrumb, {
        mb: 0,
        ml: '-1px',
        css: {
          flexGrow: 1,
          lineHeight: '17px',
          border: '1px solid #bfc5ca',
          borderRadius: '0 2px 2px 0',
        }
      }, makeBreadcrumb(props)))
    }

    const menu = menuChildren.length
      ? h(Flex, { alignItems: 'center', mb: 2 }, menuChildren)
      : null


    return (
      h(Box, { css: { width: '100%', flexGrow: 1, }}, [
        menu,
        h(resource.Component, props)
      ])
    )
  }

  Resource.displayName = 'WrappedResource(' + resource.Component.displayName + ')';

  return Resource
}

function getApplicationResources() {
  if (!resources) {
   resources = [...modules.values()].reduce((acc, { resources={} }) =>
     Object.assign(
       {},
       acc,
       R.map(resource => Object.assign({}, resource, {
         Component: makeResourceComponent(resource),
         onBeforeRoute: resource.onBeforeRoute,
       }), resources),
     ), {})
  }

  return resources
}

function getApplicationReducer() {
  if (!reducer) {
    reducer = combineReducers([...modules].reduce((acc, [label, { reducer }]) =>
      reducer
        ? Object.assign({}, acc, { [label]: reducer })
        : acc,
      {}
    ))
  }

  return reducer
}

module.exports = {
  getApplicationResources,
  getApplicationReducer,
}
