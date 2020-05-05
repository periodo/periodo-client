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
  require('./Alerts'),
  require('./Authority'),
  require('./Autosuggest'),
  require('./BackendContext'),
  require('./Base'),
  require('./Breadcrumb'),
  require('./Buttons'),
  require('./Dataset'),
  require('./Debug'),
  require('./Details'),
  require('./DropdownMenu'),
  require('./FormElements'),
  require('./Icons'),
  require('./InlineList'),
  require('./InputBlock'),
  require('./LabeledMap'),
  require('./Links'),
  require('./Notes'),
  require('./Pager'),
  require('./Patch'),
  require('./Period'),
  require('./PlaceSuggest'),
  require('./PlacesSelect'),
  require('./Source'),
  require('./Status'),
  require('./Tabs'),
  require('./Tags'),
  require('./TimeSlider'),
  require('./Typography'),
  require('./WorldMap'),
  require('./diffable/Value'),
])
