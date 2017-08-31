# ORG Layouts

A library for creating and configuring interactive visual layouts of streaming data.

# API

```js
const { makeLayoutEngine, DOMBlock } = require('org-layouts')
    , { withState } = require('recompose')

const blocks = {
  counter: DOMBlock({
    label: 'Counter',
    description: 'Show count of items that have been streamed',
    shouldReset: () => false,

    init(el) {
      this.el = el;
    },

    update(items) {
      this.el.textContent = `Total items: ${items.length}`
    }
  })
}

const Engine = makeLayoutEngine(blocks, createReadStream)

const defaultSpec = {
  blocks: [
    { name: 'counter' }
  ]
}

const MyLayoutEngine = ({ spec, onSpecChange }) =>
  h(Engine, {
    spec,
    onSpecChange
  })

module.exports = withState('spec', 'updateSpec', defaultSpec)(MyLayoutEngine)
```
