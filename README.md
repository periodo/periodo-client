# PeriodO Client
A Web browser application for browsing and editing [PeriodO](http://perio.do/) data.

Compatible with all browsers that support ES6 and IndexedDB. Safari has known issues complying with the latter, and we cannot guarantee that PeriodO supports it (as of March 2017).

## Development
Run `make zip` to build a zipfile containing all the files required to run the application at `dist/periodo-$VERSION.zip`. Because browsers do not support IndexedDB for pages served from local file systems, you will need to serve locally via HTTP.

If you have python3 installed, running `make serve` will serve a development version of the site at <http://localhost:8020/>. Run `make watch` to rebuild this version upon any edit to source files.

Use `make test` to run all tests (Node 7+ required).

## CORS proxy
Because this is a browser-based application that makes frequent use of
cross-origin linked data, it is often necessary to tunnel requests through a
proxy that adds CORS headers or fixes broken CORS implementations. The proxy URL
is configurable, and can be changed in the `CORS_PROXY_URL` variable
defined in `src/linked_data_cache.js`.


## Source layout
