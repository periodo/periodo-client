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
  require('./components/Alerts'),
  require('./components/Authority'),
  require('./components/Autosuggest'),
  require('./components/BackendContext'),
  require('./components/Base'),
  require('./components/Breadcrumb'),
  require('./components/Buttons'),
  require('./components/Dataset'),
  require('./components/Debug'),
  require('./components/Details'),
  require('./components/DropdownMenu'),
  require('./components/FormElements'),
  require('./components/Icons'),
  require('./components/InlineList'),
  require('./components/InputBlock'),
  require('./components/LabeledMap'),
  require('./components/Links'),
  require('./components/Notes'),
  require('./components/Pager'),
  require('./components/Patch'),
  require('./components/PlaceSuggest'),
  require('./components/PlacesSelect'),
  require('./components/Source'),
  require('./components/Status'),
  require('./components/Tabs'),
  require('./components/Tags'),
  require('./components/TimeSlider'),
  require('./components/Typography'),
  require('./components/WorldMap'),
  require('./components/diffable/Value'),
  require('./util'),
])
