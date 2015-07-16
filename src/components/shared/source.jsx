"use strict";

var React = require('react')

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

  getData: function () {
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
        value: oneOf(source, ['creators'], ['partOf', 'creators']),
        format: creators => creators.map(c => <dd key={c.get('name')} >{c.get('name')}</dd>)
      },
      {
        label: 'Contributors',
        value: oneOf(source, ['contributors'], ['partOf', 'contributors']),
        format: contributors => contributors.map(c => <dd key={c.get('name')} >{c.get('name')}</dd>)
      },
      {
        label: 'Locator',
        value: source.get('locator')
      }
    ]
  },
  render: function () {
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
