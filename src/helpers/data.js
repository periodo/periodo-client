"use strict"

function asJSONLD(data) {
  var json = data.toJS();
  json['@context'] = require('../context');
  return json;
}

function asTurtle(data) {
  return require('../utils/jsonld_to_turtle')(asJSONLD(data));
}

module.exports = { asJSONLD, asTurtle }
