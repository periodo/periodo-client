module.exports = {
  LayoutRenderer: require('./LayoutRenderer'),
  LayoutEditor: require('./LayoutEditor'),

  blocks: {
    DOM: require('./DOMBlock'),
    List: require('./ListBlock'),
  },
}
