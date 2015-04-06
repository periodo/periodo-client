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
  }
  return ret
}

pctype = emptypc
  / source
  / period

emptypc = EOF { return {
  type: 'periodCollection',
  label: null
}}


/* source stuff */

source = '/source' (.+)? { return {
  type: 'periodCollection',
  label: 'source'
}}


/* Period stuff */

period = '/definitions/' pid:pcid ret:ptype {
  ret.id = pid.join('');
  return ret
}

ptype = emptyp
  / alternatelabel
  / originallabel
  / spatialcoverage
  / startdate
  / stopdate
  / pattribute

emptyp = EOF { return {
  type: 'period',
  label: null
}}

alternatelabel = '/alternateLabel' (.+)? { return {
  type: 'period',
  label: 'alternateLabel'
}}

originallabel = '/originalLabel' (.+)? { return {
  type: 'period',
  label: 'originalLabel'
}}

spatialcoverage = '/spatialCoverage' (.+)? { return {
  type: 'period',
  label: 'spatialCoverage'
}}

startdate = '/start' (.+)? { return {
  type: 'period',
  label: 'startDate'
}}

stopdate = '/stop' (.+)? { return {
  type: 'period',
  label: 'stopDate'
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
