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
            definitions: authority.definitions,
          }))
        )(props.dataset.periodCollections)
      ),
    extraProps: { backend: props.backend },
  })))

PeriodoLayoutRenderer.propTypes = {
  dataset: PropTypes.shape({
    periodCollections: PropTypes.object.isRequired,
  }),
  backend: PropTypes.object.isRequired,
}

module.exports = PeriodoLayoutRenderer;
