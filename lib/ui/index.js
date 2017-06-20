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
  require('./Source'),
  require('./Alerts'),
  require('./Tabs'),
])