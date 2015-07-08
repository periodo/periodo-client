# PeriodO Client
A web application for browsing and editing [PeriodO](http://perio.do/) data.

## Development
NPM is required for development. Run `npm install` from the project directory
to set up a development environment.

This application uses [browserify](http://browserify.org/) to structure code.
The main entry point is `src/index.js`. Run `make build` to bundle
the application or `make watch` to use [watchify](https://github.com/substack/watchify)
to automatically bundle as files are edited.

Tests are run using PhantomJS run with [mochify](https://github.com/mantoni/mochify.js).
Use `npm test` to run all tests.

## CORS proxy
Because this is a browser-base application that makes frequent use of
cross-origin linked data, it is often necessary to tunnel requests through a
proxy that adds CORS headers or fixes broken CORS implementations. The proxy URL
is configurable, and can be changed in the `CORS_PROXY_URL` variable
defined in `src/linked_data_cache.js`.

## Sample country data
The pregenerated data to select spatial regions was obtained from DBPedia using
the following SPARQL query:

```
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbprop: <http://dbpedia.org/property/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

SELECT 
  ?place,
  (sample(?label) as ?Label),
  (sample(?geonamesURI) as ?GeonamesURI),
  (sample(?depiction) as ?Depiction)

WHERE {
 ?place a dbo:Country .
 ?place rdfs:label ?label .
 ?place foaf:depiction ?depiction .
 ?place owl:sameAs ?geonamesURI .
 FILTER langMatches(lang(?label), 'en') .
 FILTER regex(str(?geonamesURI), 'geonames\\.org') .
 FILTER regex(str(?depiction), 'svg', 'i')
}

GROUP BY ?place
```
