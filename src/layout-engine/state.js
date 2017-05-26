"use strict";

const through = require('through2')
    , StreamArray = require('stream-array')
    , { PassThrough } = require('stream')

function identity(x) {
  return x
}

module.exports = class EngineState {
  constructor(dataset, layouts, recordAccessors) {
    this.dataset = [...dataset]
    this.layouts = layouts
    this.recordsByType = {};
    this.recordAccessors = recordAccessors;

    Object.keys(recordAccessors).forEach(type => {
      this.recordsByType[type] = [];
    })
  }

  getRecordForItem(index, type) {
    const getter = this.recordAccessors[type]

    if (!this.recordsByType[type][index]) {
      this.recordsByType[type][index] = getter(this.dataset[index]);
    }

    return this.recordsByType[type][index]
  }

  getLayout(name) {
    const layout = this.layouts[name]

    if (!layout) {
      throw new Error(`No registered layout with name ${name}`)
    }

    return layout
  }

  groupPropsFromSpec(spec) {
    return spec.reduce((acc, { layouts }) =>
      acc.concat(layouts.map(({ name, opts }) => {
        const { deriveOpts=identity } = this.getLayout(name)

        return [opts, deriveOpts(opts) || {}]
      })),
      []
    )
  }

  getLayoutProps(spec) {
    const streams = this.getDataStreams(spec)
        , opts = this.groupPropsFromSpec(spec)

    return {
      streams,
      layoutProps: spec.map((group, i) =>
        group.layouts.map((layout, j) => Object.assign({}, layout, {
          layout: this.getLayout(layout.name),
          stream: streams[i].pipe(PassThrough({ objectMode: true })),
          derivedOpts: opts[i][j]
        }))
      )
    }
  }

  getDataStreams(spec) {
    const opts = this.groupPropsFromSpec(spec)

    const initialStream = StreamArray(this.dataset.map((item, index) =>
      this.getRecordForItem.bind(this, index)
    ))

    return spec.reduce((acc, { layouts }, i) => {
      const lastStream = acc.slice(-1)[0]
          , state = this

      return acc.concat(lastStream.pipe(through.obj(function (getRecord, enc, cb) {
        let match = null

        for (let j = 0; j < layouts.length; j++) {
          const { filterItems } = state.getLayout(layouts[j].name)

          if (!filterItems) continue;

          match = filterItems(getRecord, opts[i][j])

          if (match) break;
        }

        if (match || match === null) {
          this.push(getRecord);
        }

        cb();
      })))
    }, [initialStream])
  }
}
