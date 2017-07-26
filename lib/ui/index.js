"use strict";

function addUIModules(mods) {
  mods.forEach(mod => {
    Object.assign(exports, mod);
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
])
