"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('periodo-ui')

class LayoutBlock extends React.Component {
  shouldComponentUpdate(nextProps) {
    const monitored = [
      'extraProps', 'processedOpts', 'passedOpts', 'defaultOpts',
    ]

    if (this.props.data !== nextProps.data) {
      return true
    }

    for (const key of monitored) {
      if (!R.equals(this.props[key], nextProps[key])) {
        return true
      }
    }

    return false;
  }

  render() {
    const {
      id,
      defaultOpts,
      passedOpts,
      processedOpts,
      extraProps,
      setBlockState,
      data,
      block: { Component },
      onOptsChange,
      invalidate,
      hidden,
    } = this.props

    const opts = {
      ...defaultOpts,
      ...passedOpts,
    }

    const updateOpts = (fn, invalidate) => {
      const updated = typeof fn === 'object'
        ? ({
          ...opts,
          ...fn,
        })
        : fn(opts)

      const newOpts = {}

      for (const k in updated) {
        const addToNewOpts = (
          updated[k] != undefined &&
          defaultOpts[k] !== updated[k] &&
          !!(defaultOpts[k] || updated[k])
        )

        if (addToNewOpts) {
          newOpts[k] = updated[k]
        }
      }

      onOptsChange(newOpts, invalidate)
    }

    return (
      h(Box, {
        id,
        mb: 3,
        minWidth: 0,
        minHeight: 0,
      }, [
        h(Component, {
          opts,
          updateOpts,
          data,
          setBlockState,
          invalidate,
          hidden,
          ...processedOpts,
          ...extraProps,
        }),
      ])
    )
  }
}

module.exports = LayoutBlock
