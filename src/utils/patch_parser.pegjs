// vim: set filetype=javascript

start = '/' ret:path { return ret }

path = periodcollection
  / context
  / type

context = '@context' (.+)? { return {
  type: 'context',
  label: null,
  id: null
}}

type = 'type' { return {
  type: 'type',
  label: null
}}


/* periodCollection stuff */

periodcollection = 'periodCollections/' pcid:pcid ret:pctype {
  if (ret.type === 'periodCollection') {
    ret.id = pcid.join('');
  } else {
    ret.collection_id = pcid.join('');
  }
  return ret
}

pctype = emptypc
  / source
  / editorialnote
  / period

emptypc = EOF { return {
  type: 'periodCollection',
  label: null
}}


/* Period collection changes */

source = '/source' (.+)? { return {
  type: 'periodCollection',
  label: 'source'
}}

editorialnote = '/editorialNote' { return {
  type: 'periodCollection',
  label: 'editorialNote'
}}


/* Period changes */

period = '/definitions/' pid:pcid ret:ptype {
  ret.id = pid.join('');
  return ret
}

ptype = emptyp
  / localizedLabels
  / spatialCoverageDescription
  / spatialcoverage
  / startdate
  / stopdate
  / pattribute

emptyp = EOF { return {
  type: 'period',
  label: null
}}

localizedLabels = '/localizedLabels' (.+)? { return {
  type: 'period',
  label: 'localizedLabels'
}}

spatialCoverageDescription = '/spatialCoverageDescription' (.+)? { return {
  type: 'period',
  label: 'spatialCoverageDescription'
}}


spatialcoverage = '/spatialCoverage' (.+)? { return {
  type: 'period',
  label: 'spatialCoverage'
}}

startdate = '/start' (.+)? { return {
  type: 'period',
  label: 'start'
}}

stopdate = '/stop' (.+)? { return {
  type: 'period',
  label: 'stop'
}}

pattribute = '/' label:labelpathchars+ { return {
  type: 'period',
  label: label.join('')
}}


/* Variables */
EOF = !.
alpha = [a-zA-Z]
labelpathchars = alpha / [/-]
loweralphanumeric = [a-z0-9]
pcid = [a-zA-Z0-9.:~-]+
