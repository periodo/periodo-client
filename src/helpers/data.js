"use strict"

function asJSONLD(data) {
  var json = data.toJS();
  json['@context'] = require('../context');
  return json;
}

function prefixLines(text, prefix) {
  return text
    .split('\n')
    .map(line => prefix + line.trim())
    .join('\n')
}

function inlineBlankNodes(blankNodesMap, ttl) {
  var regex = /^(\s+)([^ ]+ )(_:b\d+)/gm
    , inlined

  inlined = ttl.replace(regex, (match, whitespace, predicate, blankNode) => {
    return (
      whitespace + predicate + '[\n' +
      prefixLines(blankNodesMap[blankNode], whitespace + '  ') +
      '\n' + whitespace + ']'
    )
  });

  return regex.test(inlined) ? inlineBlankNodes(blankNodesMap, inlined) : inlined;
}

function replaceBlankNodes(ttl) {
  var regex = /^(_:b\d+) ([\s\S]+?)\.$/gm
    , nodes = {}
    , strippedTtl

  strippedTtl = ttl.replace(regex, (match, nodeName, nodeValue) => {
    nodes[nodeName] = nodeValue;
    return '';
  });

  strippedTtl = strippedTtl.replace(/\n{2}\n*/, '\n\n');

  return inlineBlankNodes(nodes, strippedTtl);
}

function asTurtle(data, shouldInlineBlankNodes) {
  return require('../utils/jsonld_to_turtle')(asJSONLD(data))
    .then(ttl => shouldInlineBlankNodes ? replaceBlankNodes(ttl) : ttl)
}

module.exports = { asJSONLD, asTurtle }
