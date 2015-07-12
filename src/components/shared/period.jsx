"use strict";

var React = require('react')
  , Immutable = require('immutable')

function makeLink(url) {
  return url && <a target="_blank" href={url}>{url}</a>
}

module.exports = React.createClass({
  displayName: 'Period',

  getDefaultProps: function () {
    return { linkify: true }
  },

  render: function () {
    var { asString } = require('../../helpers/terminus')
      , linkify = this.props.linkify ? require('../../utils/linkify') : text => text
      , asURL = this.props.linkify ? makeLink : text => text
      , period = this.props.period
      , simpleFields
      , noteFields
      , startString
      , stopString

    period = this.props.period;

    simpleFields = [
      {
        value: period.getIn(['locator']),
        label: 'Locator'
      },
      {
        value: asURL(period.getIn(['url'])),
        label: 'URL'
      },
      {
        value: asURL(period.getIn(['sameAs'])),
        label: 'Same as'
      },
      {
        value: period.getIn(['spatialCoverageDescription']),
        label: 'Spatial coverage description'
      }
    ];

    noteFields = [
      {
        value: linkify(period.get('note', '')),
        label: 'Notes in source'
      },
      {
        value: linkify(period.get('editorialNote', '')),
        label: 'Editorial notes'
      }
    ];



    startString = asString(period.get('start', Immutable.Map()));
    stopString = asString(period.get('stop', Immutable.Map()));

    return (
      <dl className="dl-horizontal period-details">
        <div className="field">
          <dt>Original label</dt>
          <dd>
            {
              this.props.period.get('originalLabel')
                .map((val, script) => `${val} (${script})`)
                .first()
            }
          </dd>
        </div>

        {
        !this.props.period.get('alternateLabel') ? '' :
        <div className="field">
          <dt>Alternate labels</dt>
          <dd>
            <ul className="list-unstyled">
            {this.props.period.get('alternateLabel')
              .map((labels, lang) => labels.map(label => Immutable.Map({ label, lang })))
              .toList()
              .flatten(1)
              .map(label => <li key={label}>{label.get('label')} ({label.get('lang')})</li>)}
            </ul>
          </dd>
        </div>
        }

        {
          simpleFields.map(field => !field.value ? '' : (
            <div key={field.label} className="field">
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))
        }

        {
          !period.has('spatialCoverage') ? '' :
          <div className="field">
            <dt>Spatial coverage</dt>
            <dd>
              <ul className="list-unstyled">
                {period.get('spatialCoverage')
                  .map(coverage => (
                    <li key={coverage.get('id')}>
                    {!this.props.linkify ?
                     coverage.get('label') :
                     <a href={coverage.get('id')} target="_blank">
                        {coverage.get('label')}
                     </a>}
                    </li>
                  ))}
              </ul>
            </dd>
          </div>
        }

        <div className="field">
          <dt>Start</dt>
          <dd>
            {period.getIn(['start', 'label'], 'unknown')}
            {startString && <br />}
            {startString && ('(ISO value: ' + startString + ')')}
          </dd>
        </div>

        <div className="field">
          <dt>Stop</dt>
          <dd>
            {period.getIn(['stop', 'label'], 'unknown')}
            {stopString && <br />}
            {stopString && ('(ISO value: ' + stopString + ')')}
          </dd>
        </div>

        {
          noteFields.filter(field => field.value).map(field => (
            <div key={field.label} className="field">
              <dt>{field.label}</dt>
              <dd dangerouslySetInnerHTML={{ __html: field.value }} />
            </div>
          ))
        }

      </dl>
    )
  }
});
