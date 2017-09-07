'use strict';

//------------------------------------------------------------------------------
const period =
{ minimal:
  { id: 'test-minimal-period'
  , label: 'Later Han Dynasty'
  , language: 'en'
  , localizedLabels: {en: ['Later Han Dynasty']}
  , start: {label: '947', in: {year: '0947'}}
  , stop: {label: '950', in: {year: '0950'}}
  }

, minimalAltered:
  { id: 'test-minimal-period'
  , type: 'PeriodDefinition'
  , label: '后汉'
  , language: 'cmn-Hans'
  , localizedLabels: {'cmn-Hans': [ '后汉' ]}
  , start: {label: '950', in: {year: '0950'}}
  , stop: {label: '960ish', in: {earliestYear: '0959'}}
  , spatialCoverageDescription: 'somewhere!'
  }

, maximal:
  { id: 'test-maximal-period'
  , type: 'PeriodDefinition'
  , label: 'Later Han Dynasty'
  , language: 'en-Latn'
  , localizedLabels:
    { 'en-Latn': [ 'Later Han Dynasty' ]
    , 'cmn-Hans': [ '后汉' ]
    , 'cmn-Hant': [ '後漢' ]
    }
  , start: {label: '943', in: {year: '0947'}}
  , stop: {label: '949', in: {year: '0949'}}
  , note: 'Latitude: 34.78, longitude: 114.34'
  , editorialNote: 'Parent period: Wudai Shiguo, 五代十国'
  , source: {locator: 'page 364'}
  , spatialCoverage:
    [ {id: 'http://dbpedia.org/resource/China', label: 'China'}
    , {id: 'http://dbpedia.org/resource/More China', label: 'More China'}
    ]
  , spatialCoverageDescription: 'China'
  , sameAs: 'http://example.org/someperiod'
  , url: 'http://example.org/someurl'
  }

, maximalAltered:
  { id: 'test-maximal-period'
  , label: 'Later Fun Dynasty'
  , language: 'en'
  , localizedLabels:
    { en: [ 'Later Fun Dynasty' ]
    , 'cmn-Hans': [ '后汉' ]
    , 'cmn-Hant': [ '後漢' ]
    , 'cmn-Latn': [ 'Houhan' ]
    }
  , start: {label: '947', in: {year: '0947'}}
  , stop: {label: '950', in: {year: '0950'}}
  , note: 'First capital: 开封, latitude: 34.78, longitude: 114.34'
  , editorialNote: 'Parent period: Wudai Shiguo, 五代十国, and http://foo.org, well, it is a link'
  , source: {locator: 'pg. 369'}
  , spatialCoverage:
    [ {id: 'http://dbpedia.org/resource/China', label: 'China'}
    ]
  , spatialCoverageDescription: 'China and territories'
  , sameAs: 'http://example.net/someperiod'
  , url: 'https://example.org/someurl'
  }
}
//------------------------------------------------------------------------------
const source =
{ minimal: {}

, minimalAltered:
    { citation: 'Dawn Hayes in Use for a Website on Norman Sicily'}

, maximal:
    { id: 'test-maximal-source'
    , partOf: 'http://www.worldcat.org/oclc/68390968'
    , title: 'The Oxford clossical dictionary.'
    , yearPublished: 2017
    , dateAccessed: '2014-02-09'
    , creators:
      [ { id: 'http://wtf.net' }
      , { id: 'http://viaf.org/viaf/66565783'
        , name: 'Hornblower, Simon.'
        }
      ]
    , contributors:
      [ { id: 'http://viaf.org/viaf/29582600'
        , name: 'Spawforth, Antony (Antony J.S.)'
        }
      , { name: 'Smicky Smacky' }
      , { id: 'http://viaf.org/viaf/170370248'
        , name: 'Bradley Manning'
        }
      ]
    , citation: 'Dawn Marie Hayes in Use for a Website on Norman Sicily'
    , abstract: 'Pleiades gives scholars, students, and enthusiasts worldwide the ability to use, create, and share historical geographic information about the ancient world in digital form, suckas!'
    , locator: 'page 561'
    , editorialNote: 'this is real'
    , sameAs: 'http://linked-data-is-lame.org/foobar'
    , url: 'https://a-web-page-about-it.org/'
    }

, maximalAltered:
    { id: 'test-maximal-source'
    , locator: 'page 651'
    , partOf:
        { title: 'The Oxford classical dictionary.'
        , yearPublished: 2003
        , dateAccessed: '2014-09-02'
        , creators:
          [ { id: 'http://viaf.org/viaf/29582600'
            , name: 'Spawforth, Antony (Antony J.S.)'
            }
          ]
        , contributors:
          [ { id: 'http://viaf.org/viaf/66565783'
            , name: 'Hornblower, Simon.'
            }
          , { name: 'Smicky Smacky' }
          , { id: 'http://viaf.org/viaf/170370248'
            , name: 'Chelsea Manning'
            }
          ]
        , citation: 'Dawn in Use for a Website on Norman Sicily'
        , abstract: 'Pleiades gives scholars, students, and enthusiasts worldwide the ability to use, create, and share historical geographic information about the ancient world in digital form.'
        , locator: 'page 561'
        , editorialNote: 'this is fake'
        , sameAs: 'http://linked-data-is-cool.org/foobar'
        , url: 'http://a-web-page-about-it.org/'
        }
    }
}
//------------------------------------------------------------------------------
const authority =
{ minimal: { id: 'test-minimal-authority', source: source.minimal }

, minimalAltered:
    { id: 'test-minimal-authority'
    , type: 'PeriodCollection'
    , source: source.minimalAltered
    }

, maximal:
    { id: 'test-maximal-authority'
    , source: source.maximal
    , editorialNote: 'whoop whoop'
    , sameAs: 'http://linked-data-is-cool.org/bizbaz'
    , definitions:
      { minimal: period.minimal
      , maximal: period.maximal
      }
    }

, maximalAltered:
    { id: 'test-maximal-authority'
    , type: 'PeriodCollection'
    , source: source.maximalAltered
    , editorialNote: 'whoop it up!!!'
    , sameAs: 'http://linked-data-is-ok.org/bizbaz'
    , definitions:
      { minimal: period.minimal // unchanged
      , maximal: period.maximalAltered
      }
    }
}

//------------------------------------------------------------------------------
const dataset =
{ minimal:
    { id: 'test-minimal-dataset'
    , type: 'rdf:Bag'
    , periodCollections: {}
    , '@context': {}
    }

, minimalAltered:
    { id: 'test-minimal-dataset'
    , type: 'rdf:Bag'
    , periodCollections: {minimal: authority.minimal}
    , '@context': {}
    }

, maximal:
    { id: 'test-maximal-dataset'
    , type: 'Bag'
    , periodCollections:
        { maximal: authority.maximal
        , minimal: authority.minimal
        }
    , '@context':
        { '@base': 'http://n2t.net/ark:/99152/'
        , PeriodCollection: 'http://www.w3.org/2004/02/skos/core#ConceptScheme'
        , PeriodDefinition: 'http://www.w3.org/2004/02/skos/core#Concept'
        , abstract: 'http://purl.org/dc/terms/abstract'
        , collection:
            { '@id': 'http://www.w3.org/2004/02/skos/core#inScheme'
            , '@type': '@id'
            }
        , contributors:
            { '@container': '@set'
            , '@id': 'http://purl.org/dc/terms/contributor'
            }
        , creators:
            { '@container': '@set'
            , '@id': 'http://purl.org/dc/terms/creator'
            }
        , dateAccessed:
            { '@id': 'http://purl.org/dc/terms/date'
            , '@type': 'http://www.w3.org/2001/XMLSchema#date'
            }
        , definitions:
            { '@container': '@index'
            , '@reverse': 'http://www.w3.org/2004/02/skos/core#inScheme'
            }
        , earliestYear:
            { '@id': 'periodo:earliestYear'
            , '@type': 'http://www.w3.org/2001/XMLSchema#gYear'
            }
        , editorialNote: 'http://www.w3.org/2004/02/skos/core#editorialNote'
        , id: '@id'
        , in: 'http://www.w3.org/2006/time#hasDateTimeDescription'
        , inDataset:
            { '@id': 'http://rdfs.org/ns/void#inDataset'
            , '@type': '@id'
            }
        , label: 'http://www.w3.org/2004/02/skos/core#prefLabel'
        , language: 'http://purl.org/dc/terms/language'
        , latestYear:
            { '@id': 'periodo:latestYear'
            , '@type': 'http://www.w3.org/2001/XMLSchema#gYear'
            }
        , localizedLabels:
            { '@container': '@language'
            , '@id': 'http://www.w3.org/2004/02/skos/core#altLabel'
            }
        , locator: 'http://purl.org/ontology/bibo/locator'
        , name: 'http://xmlns.com/foaf/0.1/name'
        , note: 'http://www.w3.org/2004/02/skos/core#note'
        , partOf:
            { '@id': 'http://purl.org/dc/terms/isPartOf'
            , '@type': '@id'
            }
        , periodCollections:
            { '@container': '@index'
            , '@id': 'http://www.w3.org/2000/01/rdf-schema#member'
            }
        , periodo: 'http://n2t.net/ark:/99152/p0v#'
        , primaryTopicOf:
            { '@id': 'http://xmlns.com/foaf/0.1/isPrimaryTopicOf'
            , '@type': '@id'
            }
        , sameAs:
            { '@id': 'http://www.w3.org/2002/07/owl#sameAs'
            , '@type': '@id'
            }
        , source: 'http://purl.org/dc/terms/source'
        , spatialCoverage:
            { '@container': '@set'
            , '@id': 'http://purl.org/dc/terms/spatial'
            }
        , spatialCoverageDescription: 'periodo:spatialCoverageDescription'
        , start: 'http://www.w3.org/2006/time#intervalStartedBy'
        , stop: 'http://www.w3.org/2006/time#intervalFinishedBy'
        , title: 'http://purl.org/dc/terms/title'
        , type: '@type'
        , url:
            { '@id': 'http://xmlns.com/foaf/0.1/page'
            , '@type': '@id'
            }
        , year:
            { '@id': 'http://www.w3.org/2006/time#year'
            , '@type': 'http://www.w3.org/2001/XMLSchema#gYear'
            }
        , yearPublished:
            { '@id': 'http://purl.org/dc/terms/issued'
            , '@type': 'http://www.w3.org/2001/XMLSchema#gYear'
            }
        }
    }

, maximalAltered:
    { id: 'test-maximal-dataset'
    , type: 'rdf:Bag'
    , periodCollections:
        { minimal: authority.minimal
        , maximal: authority.maximalAltered
        }
    , '@context':
        { '@base': 'http://n2t.net/ark:/99152/'
        , PeriodCollection: 'http://www.w3.org/2004/02/skos/core#ConceptScheme'
        , PeriodDefinition: 'http://www.w3.org/2004/02/skos/core#Concept'
        , abstract: 'http://purl.org/dc/terms/abstract'
        , collection:
            { '@id': 'http://www.w3.org/2004/02/skos/core#inScheme'
            , '@type': '@id'
            }
        , contributors:
            { '@container': '@set'
            , '@id': 'http://purl.org/dc/terms/contributor'
            }
        , creators:
            { '@container': '@set'
            , '@id': 'http://purl.org/dc/terms/creator'
            }
        , dateAccessed:
            { '@id': 'http://purl.org/dc/terms/date'
            , '@type': 'http://www.w3.org/2001/XMLSchema#date'
            }
        , definitions:
            { '@container': '@index'
            , '@reverse': 'http://www.w3.org/2004/02/skos/core#inScheme'
            }
        , earliestYear:
            { '@id': 'periodo:earliestYear'
            , '@type': 'http://www.w3.org/2001/XMLSchema#gYear'
            }
        , editorialNote: 'http://www.w3.org/2004/02/skos/core#editorialNote'
        , id: '@id'
        , in: 'http://www.w3.org/2006/time#hasDateTimeDescription'
        , inDataset:
            { '@id': 'http://rdfs.org/ns/void#inDataset'
            , '@type': '@id'
            }
        , label: 'http://www.w3.org/2004/02/skos/core#prefLabel'
        , language: 'http://purl.org/dc/terms/language'
        , latestYear:
            { '@id': 'periodo:latestYear'
            , '@type': 'http://www.w3.org/2001/XMLSchema#gYear'
            }
        , localizedLabels:
            { '@container': '@language'
            , '@id': 'http://www.w3.org/2004/02/skos/core#altLabel'
            }
        , locator: 'http://purl.org/ontology/bibo/locator'
        , name: 'http://xmlns.com/foaf/0.1/name'
        , note: 'http://www.w3.org/2004/02/skos/core#note'
        , partOf:
            { '@id': 'http://purl.org/dc/terms/isPartOf'
            , '@type': '@id'
            }
        , periodCollections:
            { '@container': '@index'
            , '@id': 'http://www.w3.org/2000/01/rdf-schema#member'
            }
        , periodo: 'http://n2t.net/ark:/99152/p0v#'
        , primaryTopicOf:
            { '@id': 'http://xmlns.com/foaf/0.1/isPrimaryTopicOf'
            , '@type': '@id'
            }
        , rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
        , sameAs:
            { '@id': 'http://www.w3.org/2002/07/owl#sameAs'
            , '@type': '@id'
            }
        , source: 'http://purl.org/dc/terms/source'
        , spatialCoverage:
            { '@container': '@set'
            , '@id': 'http://purl.org/dc/terms/spatial'
            }
        , spatialCoverageDescription: 'periodo:spatialCoverageDescription'
        , start: 'http://www.w3.org/2006/time#intervalStartedBy'
        , stop: 'http://www.w3.org/2006/time#intervalFinishedBy'
        , title: 'http://purl.org/dc/terms/title'
        , type: '@type'
        , url:
            { '@id': 'http://xmlns.com/foaf/0.1/page'
            , '@type': '@id'
            }
        , year:
            { '@id': 'http://www.w3.org/2006/time#year'
            , '@type': 'http://www.w3.org/2001/XMLSchema#gYear'
            }
        , yearPublished:
            { '@id': 'http://purl.org/dc/terms/issued'
            , '@type': 'http://www.w3.org/2001/XMLSchema#gYear'
            }
        }
    }
}

//------------------------------------------------------------------------------
const { compare } = require('fast-json-patch')

const patch =
{ minimal: compare(dataset.minimal, dataset.minimalAltered)
, minimalReverse: compare(dataset.minimalAltered, dataset.minimal)
, maximal: compare(dataset.maximal, dataset.maximalAltered)
, maximalReverse: compare(dataset.maximalAltered, dataset.maximal)
}

module.exports =
{ period
, source
, authority
, dataset
, patch
}
