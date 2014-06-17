# PeriodO Client
A web application for browsing and editing [PeriodO](http://perio.do/) data.

## Development
NPM is required for development. Run `make setup` to install dependencies and 
set up necessary directories.

This application uses [browserify](http://browserify.org/) to structure code.
The main entry point is `src/app.js`. Run `make build` to bundle the application
or `make watch` to use [watchify](https://github.com/substack/watchify) to
automatically bundle as files are edited.
