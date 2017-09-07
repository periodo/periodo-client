# ORG Layouts

A library for creating and configuring interactive visual layouts of streaming data.

# API

We will make a simple streaming layout using data adapted from the time periods compiled at `<http://n2t.net/ark:/99152/p083p5r.json>`. Our layout will consist of a series of *blocks* which render and filter based on *streams* of time periods that have labels, start dates, and end dates.

```js
const periods = [
  {
    label: 'Geometric period',
    start: {
      label: '900 BC',
      value: -899,
    },
    stop: {
      label: '700 BC',
      value: -699,
    },
  },

  {
    label: 'Orientalizing period',
    start: {
      label: 'ca. 725 BC',
      value: -724,
    },
    stop: {
      label: '600 BC',
      value: -599,
    },
  },

  {
    label: 'Archaic period',
    start: {
      label: 'ca. 600 BC',
      value: -599,
    },
    stop: {
      label: '479 BC',
      value: -478,
    }
  },
]
```

Next, we'll define two different blocks. One will count the periods that are streamed through it, and the other will be a simple text input that will filter periods base on their labels.

```js
const through = require('through2')
    , { DOMBlock } = require('org-layouts')

const blocks = {
  // Helper functions are available to create blocks based on some simple
  // semantics. `DOMBlock` creates a block that passes a DOM element to an
  // `init()` function, and a list of consumed items from a stream to an
  // `update()` function.
  counter: DOMBlock({
    init(el) {
      this.el = el;
    },

    update(periods) {
      this.el.textContent = `Total documents: ${periods.length}`
    }
  }),


  // Blocks are able to transform the streams passed into them based on options
  // that can be set interactively. In this example, a block renders a text
  // input whose value is turned into a stream filter that only passes through
  // periods with matching labels.
  labelFilter: {
    Component: ({ text='', updateOpts, invalidate }) =>
      h('input', {
        type: 'text',
        placeholder: 'Type to search',
        value: text,
        onChange: e => {
          updateOpts({ text: e.target.value });
          invalidate();
        }
      })
    ,

    makeOutputStream({ text }) => {
      const match = text.length
        ? period => period.label.indexOf(text) > -1
        : () => true

      return through.obj(function (data, enc, cb) {
        if (match(data)) this.write(data)
        cb();
      })
    }
  }
}
```

Now that we have a function to create a read stream, and a couple blocks that are capable of rendering the items in that stream, we can create a layout engine. We'll export a higher order component that takes an initial specification for a layout, and then allows it to be edited.

```js
const { LayoutEngine } = require('org-layouts')
    , fromArray = require('from2-array')

module.exports = function PeriodLayoutEngine({ spec, onSpecChange }) {
  return (
    h(LayoutEngine, {
      blocks,
      createReadStream: () => fromArray(periods),
      spec,
      onSpecChange,
    })
  )
}
```

This component could now be used to create a layout like so:

```js
const { TransientSpecEditor } = require('org-layouts')
    , PeriodLayoutEngine = require('./PeriodLayoutEngine')

const initialSpec = {
  blocks: [
    { name: 'labelFilter' },
    { name: 'counter' },
  ]
}

function PeriodComponent() {
  return (
    h('div', [
      h('h1', 'Search for periods'),
      h(TransientSpecEditor(initialSpec)(PeriodLayoutEngine)),
    ])
  )
}
```
