# PeriodO Client

A Web browser application for browsing and editing [PeriodO](http://perio.do/) data.

Compatible with all browsers that support ES2017 and IndexedDB. Safari has known issues complying with the latter, and we cannot guarantee that PeriodO supports it (as of March 2017).


# Building

To build a standalone version of the client which can be run from a static web directory, run `make zip`. This will build a zipfile containing the HTML, JavaScript, and CSS required to run the application at `dist/periodo-$VERSION.zip`. `VERSION` will be the current version of the package found in `modules/periodo-app`.

Run `make test` to run all tests. Because we use ES6/ES2017 features like arrow functions and `async`/`await`, you must have Node 8+ installed.


# Layout of this project

This is an umbrella project for several distinct sub-projects ("modules"). Each of these smaller units are npm packages found in the `modules` folder. We manage dependencies between them with a tool called [Lerna](https://lernajs.io/). Look in those folders for documentation on each individal module.


# Development

Because browsers do not support IndexedDB for pages served from local file systems, during development, you will need to run a process that will serve the `dist` directory over HTTP. The easiest way to do so is by running the command `make serve` from the project root. If you have `python3` installed, this will serve a development version of the client at <http://localhost:8020>.

Once you have set up a server to serve the root directory, run `make watch` to rebuild the site during development. This will build the files `dist/periodo.js` and `dist/periodo.css` and rebuild them upon any changes to source files.


# Code guidelines

## Writing modules

Split code into a separate npm package when it becomes apparent that it would usefully be shared across current modules boundaries.

Mark your new package "private" in its `package.json` if you do not want to publish it on npm. Prefer naming new packages with a `periodo-` prefix if it has logic specific to PeriodO, or `org-` if it does not. `org-` prefixed packages could possibly be moved into a separate repository in the future.

Export the entire API from the package index and document all exported functions in a README.md document at the package root.

## Functions

Define functions using the named function syntax at the top scope, and arrow functions assigned to a variable with `const` elsewhere. The former helps to generate meaningful stack traces, and the latter discourages side effects, prevents common issues with function scope, and, well, tends to look neater to me.

## Higher order components

When making higher order components, always export higher order functions that return a function that returns a component.

Bad:

```js
module.exports = function makeWrapper(optA, optB, Component) {
  class Wrapper extends React.Component {
    render() {
      return h(Component, Object.assign({}, this.props, this.state))
    }
  }

  return Wrapper;
}
```

Good:

```js
module.exports = function makeWrapper(optA, optB) {
  return Component => {
    class Wrapper extends React.Component {
      render() {
        return h(Component, Object.assign({}, this.props, this.state))
      }
    }

    return Wrapper;
  }
}
```
