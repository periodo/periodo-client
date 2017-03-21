{
  function formatReturn({ collectionID=null, periodID=null, attribute=null }) {
    return { collectionID, periodID, attribute }
  }
}

Start
  = '/' data:PatchPath { return formatReturn(data) }

PatchPath
  = Collection
  / '@context' OptionalTrailingPath { return { attribute: '@context' }}


Collection
  = 'periodCollections/' collectionID:Identifier data:CollectionPath {
  return Object.assign({ collectionID }, data);
}

CollectionPath
  = EOF { return {} }
  / '/' CollectionAttribute { return { attribute: text().split('/')[1] }}
  / '/' data:Period { return data }

CollectionAttribute
  = 'source' OptionalTrailingPath
  / 'editorialNote'


Period
  = 'definitions/' periodID:Identifier data:PeriodPath {
  return Object.assign({ periodID }, data);
}

PeriodPath
  = EOF { return {} }
  / '/' PeriodAttribute { return { attribute: text().split('/')[1] }}

PeriodAttribute
  = 'localizedLabels' OptionalTrailingPath
  / 'spatialCoverage' OptionalTrailingPath
  / 'start' OptionalTrailingPath
  / 'stop' OptionalTrailingPath
  / 'source' OptionalTrailingPath
  / 'url'
  / 'sameAs'
  / 'label'
  / 'note'
  / 'editorialNote'
  / 'spatialCoverageDescription'


Identifier = chars:[a-zA-Z0-9.:~-]+ { return chars.join('') }
OptionalTrailingPath = EOF / '/' (.*)
EOF = !.
