# Org-Shell

A shell for applications.

  * Routing using named query parameters

  * Serialization of resource state via updatable query parameters

  * Well-defined resource definitions, including loading data on/before page
    load

# API

```js
const h = require('react-hyperscript')
    , { ORGShell, Link, Route } = require('org-shell')
    , createStore = require('./store')

const resources = {
  '': {
    Component: () => (
      h('div', [
        h(Link('a'), {
          resource: 'hello',
          params: { name: 'Patrick' }
        }, 'Home')
      ])
    )
  },

  'hello': {
    Component: (props) => (
      h('p', `Hello, ${props.params.name}`)
    )
  }
}

const ApplicationContainer = props =>
  h('div', [
    h('header', 'Header'),
    h('main', {}, props.children),
    h('footer', 'Footer'),
  ])

const Application = ORGShell({
  store: createStore(),
  resources
}, ApplicationContainer)

ReactDOM.render(Application)
```

# ORGShell(opts, Component)

The main piece of this library is the higher-order component ORGShell. It takes several options, two of which are required.

  * `opts.store` (required): A Redux store

  * `opts.resources` (required): A map of resources (see below)

  * `opts.NotFoundComponent`: A component to be rendered when a resource is not found

## Definining resources

Resources are plain objects that have one required key (`Component`), and several optional ones that handle resource loading and prop mapping.

  * `Component`: The component that will be rendered for this resource. Several props are provided:

    - `params`: An object of the static parameters passed to this resource

    - `opts`: An object of the dynamic options passed to this resources

    - `updateOpts`: A function (to be called with a function) to update the resource's current options. For example:

        ```js
        updateOpts(prevOpts => Object.assign({}, prevOpts, { value: 4 }))
        ```

# Route(resourceName, params)

A simple constructor to refer to a route within the application, along with (optionally) some static parameters, such as an item ID or similar.

Only meant to be used as an argument to components wrapped with `Link`.

# Link(Component)

A higher-order component to internally link between pages. Will provide an href property based on a route, and an onClick handler that intercepts clicks and calls pushState to change to a new resource. Takes one required prop, `route`, which must be an instance of `Route`.
