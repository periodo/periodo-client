module.exports = {
  LayoutRenderer: require('./LayoutRenderer'),
  LayoutEditor: require('./LayoutEditor'),

  blocks: {
    StreamConsuming: require('./StreamConsumingBlock'),
    DOM: require('./DOMBlock'),
    List: require('./ListBlock'),
  }
}
