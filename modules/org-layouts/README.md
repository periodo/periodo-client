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

Next, we'll define two different blocks. One will count the periods that are streamed through it, and the other will be a simple text input that will filter periods based on their labels.

```js
const through = require('through2')
    , { blocks } = require('org-layouts')

const blocks = {
  // Helper functions are available to create blocks based on some simple
  // semantics. `blocks.DOM` creates a block that passes a DOM element to an
  // `init()` function, and a list of consumed items from a stream to an
  // `update()` function.
  counter: blocks.DOM({
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
const { LayoutRenderer } = require('org-layouts')
    , fromArray = require('from2-array')
    , periodBlocks = require('./period_blocks')

module.exports = function PeriodLayoutRenderer(props) {
  return (
    h(LayoutRender, Object.assign({}, props, {
      blocks: periodBlocks,
      createReadStream: () => fromArray(periods),
    })
  )
}
```

This component could now be used to create a layout like so:

```js
const PeriodLayoutRenderer = require('./PeriodSearch')

const searchLayout = `
[]
type = label-filter

[]
type = counter
`


module.exports = class PeriodSearch extends React.Component {
  constructor() {
    this.state = { blockOpts: {} }
  }

  render() {
    return (
      h('div', [
        h('h1', 'Search for periods'),
        h(PeriodLayoutRenderer, {
          layout: searchLayout,
          periods: this.props.periods,
          blockOpts: this.state.blockOpts,
          onBlockOptsChange: blockOpts => this.setState({ blockOpts })
        })
      ])
    )
  }
}
```
