# PeriodO Client

A Web browser application for browsing and editing [PeriodO](http://perio.do/) data.

Compatible with all browsers that support ES2017 and IndexedDB. Safari has known issues complying with the latter, and we cannot guarantee that PeriodO supports it (as of March 2017).


# Building

To build a standalone version of the client which can be run from a static web directory, run `make production`.

Run `make test` to run all tests. Because we use recent JavaScript features like `async`/`await` and object rest/spread, you must have Node 11+ installed.


# Layout of this project

This is an umbrella project for several distinct sub-projects ("modules"). Each of these smaller units are npm packages found in the `modules` folder. We manage dependencies between them with a tool called [Lerna](https://lernajs.io/). Look in those folders for documentation on each individal module.


# Development

Because browsers do not support IndexedDB for pages served from local file systems, during development, you will need to run a process that will serve the root directory over HTTP.

Once you have set up a server to serve the root directory, run `make watch` to rebuild the site during development. This will build the file `periodo-client.js` and rebuild it upon any changes to source files.

## Publishing a new version

We distribute the built version of the code via npm. To publish a new version, run the following commands:

```
npm version patch
make publish
```

Replace `patch` with the type of release you want to make, according to [the docs for npm-version](https://docs.npmjs.com/cli/version) and the kind of change the new version is according to [semvar](https://docs.npmjs.com/misc/semver).

## Committing `package-lock.json`

Changes to `package-lock.json` should only ever be in a commit by themselves. Do not include changes to `package-lock.json` with commits that change other files.


<!--
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
-->
