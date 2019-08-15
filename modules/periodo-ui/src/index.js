"use strict";

function addUIModules(mods) {
  mods.forEach(mod => {
    for (const componentName in mod) {
      mod[componentName].displayName = 'UI:' + componentName;
      exports[componentName] = mod[componentName]
    }
  })
}

exports.theme = require('./theme')

addUIModules([
  require('./InputBlock'),
  require('./Debug'),
  require('./FormElements'),
  require('./Buttons'),
  require('./Alerts'),
  require('./Tabs'),
  require('./Period'),
  require('./Source'),
  require('./Authority'),
  require('./Dataset'),
  require('./Patch'),
  require('./DropdownMenu'),
  require('./Breadcrumb'),
  require('./Typography'),
  require('./Links'),
  require('./Autosuggest'),
  require('./Base'),
  require('./InlineList'),
  require('./WorldMap'),
  require('./Tags'),
  require('./BackendContext'),
  require('./Icons'),
])
