# Periodo application

(...)

## CORS proxy
Because this is a browser-based application that makes frequent use of
cross-origin linked data, it is often necessary to tunnel requests through a
proxy that adds CORS headers or fixes broken CORS implementations. The proxy URL
is configurable, and can be changed in the `CORS_PROXY_URL` variable
defined in `src/linked_data_cache.js`.

## Modules

This application is organized in a series of smaller units, which are registered upon startup in `src/modules.js` to provide the following:

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
