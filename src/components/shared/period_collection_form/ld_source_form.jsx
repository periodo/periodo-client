"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , FetchData
  , AcceptData

FetchData = React.createClass({
  getInitialState: function () {
    return { message: '' }
  },
  handleChange: function (e) {
    var fetchLD = require('../../../utils/source_ld_fetch')
      , text = e.currentTarget.value
      , url = fetchLD.match(text)

    if (!text) {
      this.setState({ message: '' });
      return;
    }

    if (!url) {
      this.setState({ message: <strong>Could not detect source.</strong> });
      return;
    }

    fetchLD.fetch(url).then(data => this.props.onFetch(Immutable.fromJS(data)))
  },
  render: function () {
    return (
      <div>
        <h3>Linked data source</h3>
        <div>
          <p>Paste text in the block below that contains a URL from a site supported by PeriodO.</p>
          <p>Currently supported formats:</p>
          <ul>
            <li>URLs from the <a href="http://worldcat.org">WorldCat</a> catalog.</li>
            <li>URLs from <a href="http://dx.doi.org">DOI lookup service</a>, searchable with <a href="http://crossref.org">CrossRef</a></li>
            <li>A DOI in the format doi:xxx.yyy (as included in many citation styles)</li>
          </ul>

          <textarea onChange={this.handleChange} style={{ width: '100%', height: '100px'}}/>
          <p>{this.state.message}</p>

        </div>
      </div>
    )
  }
});

AcceptData = React.createClass({
  render: function () {
    var Source = require('../source.jsx')
      , Input = require('../input.jsx')

    return (
      <div>
        <Source data={this.props.source} />
        <div className="source-confirm">
          <p>Incorrect source?</p>
          <div>
            <button onClick={this.props.onReset} className="btn btn-danger">‹ Reset</button>
          </div>
        </div>
        {
          this.props.source && (
            <div>
              <br />
              <br />
              <Input
                label="Locator within source"
                value={this.props.source.get('locator')}
                onChange={this.props.onLocatorChange} />
              <p className="help-block">
                If all periods are defined on a single page within this source,
                include that page number here. Otherwise, include a locator for
                individual period definitions as you create them.
              </p>
            </div>
          )
        }
      </div>
    )
  }
});

module.exports = React.createClass({
  handleFetch: function (source) {
    this.props.onSourceChange(source);
  },
  handleLocatorChange: function (e) {
    var locator = e.target.value
      , source = this.props.data
      , newSource

    newSource = source.has('partOf') ?
      source.set('locator', locator) :
      Immutable.Map({ partOf: source, locator })

    if (!locator) newSource = newSource.get('partOf');

    this.props.onSourceChange(newSource);
  },
  handleReset: function () {
    this.setState({ fetchedSource: null }, () => this.props.onSourceChange(null));
  },
  render: function () {
    return this.props.data ?
      <AcceptData
        onReset={this.handleReset}
        source={this.props.data}
        onLocatorChange={this.handleLocatorChange} /> :
      <FetchData onFetch={this.handleFetch} />
  }
});
