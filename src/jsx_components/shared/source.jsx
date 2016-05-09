"use strict";

var React = require('react')
  , Immutable = require('immutable')

function oneOf(data, ...paths) {
  var result;
  for (var i = 0; i < paths.length; i++) {
    result = data.getIn(paths[i]);
    if (result) break;
  }
  return result;
}

module.exports = React.createClass({
  displayName: 'Source',


  getData() {
    var source = this.props.data;
    return [
      {
        label: 'Title',
        value: oneOf(source, ['title'], ['partOf', 'title'])
      },
      {
        label: 'Citation',
        value: oneOf(source, ['citation'], ['partOf', 'citation'])
      },
      {
        label: 'URL',
        value: oneOf(source, ['id'], ['partOf', 'id'], ['url']),
        format: url => <dd><a href={url}>{url}</a></dd>
      },
      {
        label: 'Year published',
        value: oneOf(source, ['yearPublished'], ['partOf', 'yearPublished']) || 'unknown',
      },
      {
        label: 'Creators',
        value: (() => {
          var val = oneOf(source, ['creators'], ['partOf', 'creators']);

          val = (val || Immutable.List()).toList().filter(c => c.get('name'));
          return val.size ? val : null;
        })(),
        format: creators => creators.map(c =>
          <dd key={c.get('name')}>{c.get('name')}</dd>
        )
      },
      {
        label: 'Contributors',
        value: (() => {
          var val = oneOf(source, ['contributors'], ['partOf', 'contributors']);

          val = (val || Immutable.List()).toList().filter(c => c.get('name'));
          return val.size ? val : null;
        })(),
        format: contributors => contributors.map(c =>
          <dd key={c.get('name')}>{c.get('name')}</dd>
        )
      },
      {
        label: 'Locator',
        value: source.get('locator')
      }
    ]
  },

  render() {
    var data = this.getData();

    return (
      <dl className="dl-horizontal source">
        {data.filter(entry => entry.value).map(entry => (
          <div>
            <dt>{entry.label}</dt>
            {entry.format ? entry.format(entry.value) : <dd>{entry.value}</dd>}
          </div>
        ))}
      </dl>
    )
  }
});
