# PeriodO Client
A Web browser application for browsing and editing [PeriodO](http://perio.do/) data.

Compatible with all browsers that support ES6 and IndexedDB. Safari has known issues complying with the latter, and we cannot guarantee that PeriodO supports it (as of March 2017).

## Building and development

To build a standalone version of the client which can be run from a static web directory, run `make zip`. This will build a zipfile containing the HTML, JavaScript, and CSS required to run the application at `dist/periodo-$VERSION.zip`.

Because browsers do not support IndexedDB for pages served from local file systems, during development, you will need to run a process that will serve the `dist` directory over HTTP. The easiest way to do so is by running the command `make serve` from the project root. If you have `python3` installed, this will serve a development version of the client at <http://localhost:8020>.

Once you have set up a server to serve the root directory, run `make watch` to rebuild the site during development. This will build the files `dist/periodo.js` and `dist/periodo.css` and rebuild them upon any changes to source files.

Application tests do not require a browser environment in which to be run. If you have Node 7 or higher installed, simply run `make test` from the home directory.

### CORS proxy
Because this is a browser-based application that makes frequent use of
cross-origin linked data, it is often necessary to tunnel requests through a
proxy that adds CORS headers or fixes broken CORS implementations. The proxy URL
is configurable, and can be changed in the `CORS_PROXY_URL` variable
defined in `src/linked_data_cache.js`.


## Modules

This application is organized in a series of *modules*. Modules can be registered upon startup in `src/modules.js` to provide the following:

  * **reducer**: A reducer that maintains the state for the module. This will be included in the root resource for the application under the namespace of this module.

  * **`resources`**: The resources (i.e. application pages) that this module will serve. Resources have four attributes, one of which is optional:

    1. `name`: The name of the resource. This is required so that routes to the resource can be generated for creating links.

    2. `path`: The path at which the resource can be reached. This application uses the [`route-parser`](https://github.com/rcs/route-parser) library for defining paths to resources.

    3. `Component`: The React component which will render the resource

    4. `onBeforeRoute` (optional): A function that will be called before the application routes to and renders the resource. This is an opportunity to dispatch actions to load necessary data for rendering the resource. This function will be called with the signature **onBeforeRoute(dispatch, params, queryParams)**, where `params` is an object containing values captured in the pattern defined in `path`, and `queryParams` is an object containing values in the matched path's query parameters.

Modules only need to be registered if they will provide a reducer or resources.

Current modules deal with:

  * `auth`: Authorization and authentication

  * `backends`: Creation, maintenance, and selection of backends for datasets

  * `linked-data`: Fetching, parsing, and searching RDF data

  * `main`: Code to bootstrap the application and manage routing and base state. (And anything that doesn't fit elsewhere, probably)

  * `patches`: Creating, applying, and reviewing changes to the dataset

  * `shared`: Code shared across different modules

  * `typed-actions`: Implementation of typed actions, described in the following section

## Union Types

We rely heavily on the [`union-type`](https://www.npmjs.com/package/union-type) package to manage control flow. This is true generally throughout the application, but especially in our use of Redux.

Redux actions cannot be plain objects. Rather, they must be instances of the `ActionRequest` type defined in `src/typed-actions/types.js`. You should not create such object manually, but rather with the `makeActionType` function defined in `src/typed-actions/make_type.js`. This function will declare a new `union-type` record, with two differences. First, a namespace for the type must be declared. Second, each member of the type will have *two* specifications. The first is the format for an action request, and the second is the format for an action response. See the `BackendAction` type in `src/backends/types.js` for an example. 

## Code guidelines

### Modules

Split code into a separate npm package when it becomes apparent that it would usefully be shared across current modules boundaries. We manage several packages within this repository using [Lerna](https://lernajs.io). They are located in the `modules/` folder.

Mark your new package "private" in its `package.json` if you do not want to publish it on npm. Prefer naming new packages with a `periodo-` prefix if it has logic specific to PeriodO, or `org-` if it does not. `org-` prefixed packages may be moved into a separate repository in the future.

Export the entire API from the package index and document all exported functions in a README.md document at the package root.

### Higher order components

When making higher order components, always export higher order functions that return a function that returns a component.

Bad:

```js
module.exports = function (optA, optB, Component) {
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
module.exports = function (optA, optB) {
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
