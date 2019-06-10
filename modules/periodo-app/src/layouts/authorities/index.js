"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , PropTypes = require('prop-types')
    , { LayoutRenderer } = require('org-layouts')
    , fromArray = require('from2-array')
    , blocks = require('./blocks')

const PeriodoLayoutRenderer = props =>
  h(LayoutRenderer, R.omit(['dataset', 'backend'], Object.assign({}, props, {
    blocks,
    createReadStream: () =>
      fromArray.obj(
        R.pipe(
          R.values,
          R.map(authority => ({
            authority,
            periods: authority.periods,
          }))
        )(props.dataset.authorities)
      ),
    extraProps: { backend: props.backend, dataset: props.dataset },
  })))

PeriodoLayoutRenderer.propTypes = {
  dataset: PropTypes.shape({
    authorities: PropTypes.object.isRequired,
  }),
  backend: PropTypes.object.isRequired,
}

module.exports = PeriodoLayoutRenderer;
