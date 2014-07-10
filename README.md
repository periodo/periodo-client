# PeriodO Client
A web application for browsing and editing [PeriodO](http://perio.do/) data.

## Development
NPM is required for development. Run `make setup` to install dependencies and 
set up necessary directories.

This application uses [browserify](http://browserify.org/) to structure code.
The main entry point is `src/app.js`. Run `make build` to bundle the application
or `make watch` to use [watchify](https://github.com/substack/watchify) to
automatically bundle as files are edited.

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
