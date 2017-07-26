"use strict";

function addUIModules(mods) {
  mods.forEach(mod => {
    for (const componentName in mod) {
      mod[componentName].displayName = 'UI:' + componentName;
      exports[componentName] = mod[componentName]
    }
  })
}

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
  require('./Links'),
  require('./Autosuggest'),
])
