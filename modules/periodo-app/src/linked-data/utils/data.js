"use strict"

function asJSONLD(data) {
  const json = data.toJS()

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
  const regex = /^(\s+)([^ ]+ )(_:b\d+)/gm

  const inlined = ttl.replace(regex, (match, whitespace, predicate, blankNode) => {
    return (
      whitespace + predicate + '[\n' +
      prefixLines(blankNodesMap[blankNode], whitespace + '  ') +
      '\n' + whitespace + ']'
    )
  });

  return regex.test(inlined) ? inlineBlankNodes(blankNodesMap, inlined) : inlined;
}

function replaceBlankNodes(ttl) {
  const regex = /^(_:b\d+) ([\s\S]+?)\.$/gm
      , nodes = {}

  let strippedTtl = ttl.replace(regex, (match, nodeName, nodeValue) => {
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
