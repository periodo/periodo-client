"use strict";

const h = require('react-hyperscript')
    , Type = require('union-type')
    , R = require('ramda')
    , React = require('react')
    , { combineReducers } = require('redux')
    , { connect } = require('react-redux')
    , { Box, Flex } = require('axs-ui')
    , { Breadcrumb, DropdownMenu } = require('lib/ui')
    , modules = new Map()


let resources
  , reducer

function registerModules() {
  register('backends', require('./backends'));
  register('main', require('./main'));

  // register('auth', require('./auth'))
  // register('ld', require('./ld'))
  // register('patches', require('./patches'))
  // register('main', require('./main'))
}


const Module = Type({ Module: {
  reducer: x => x === undefined || typeof x === 'function',
  resources: x => x === undefined || typeof x === 'object',
}})

function register(ns, mod) {
  modules.set(ns, Module.ModuleOf(mod))
}

function makeResourceComponent(resource) {
  const { makeTitle, makeBreadcrumb, makeActionMenu } = resource

  let Component = class Resource extends React.Component {
    componentDidMount() {
      let title

      try {
        title = 'PeriodO client | ' + makeTitle(this.props);
      } catch(err) {
        title = 'PeriodO client';
      }

      document.title = title;
    }

    render() {
      const menuChildren = []

      if (makeActionMenu) {
        menuChildren.push(h(DropdownMenu, {
          label: resource.actionMenuTitle || 'Actions',
        }, makeActionMenu(this.props)))
      }

      if (makeBreadcrumb) {
        menuChildren.push(h(Breadcrumb, {
          mb: 0,
          ml: '-1px',
          css: {
            flexGrow: 1,
            lineHeight: '20px',
            border: '1px solid #bfc5ca',
            borderRadius: '0 2px 2px 0',
          }
        }, makeBreadcrumb(this.props)))
      }

      const menu = menuChildren.length
        ? h(Flex, { alignItems: 'center', mb: 2 }, menuChildren)
        : null


      return (
        h(Box, [
          menu,
          h(resource.Component, Object.assign({}, this.props)),
        ])
      )
    }
  }

  if (resource.mapStateToProps) {
    Component = connect(resource.mapStateToProps)(Component)
  }

  Component.displayName = 'WrappedResource(' + resource.Component.displayName + ')';

  return Component
}

function getApplicationResources() {
  if (!resources) {
   resources = [...modules.values()].reduce((acc, { resources={} }) =>
     Object.assign(
       {},
       acc,
       R.map(resource => ({
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

registerModules();

module.exports = {
  getApplicationResources,
  getApplicationReducer,
}
