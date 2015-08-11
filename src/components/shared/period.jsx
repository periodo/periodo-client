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
      , { getOriginalLabel, getAlternateLabels } = require('../../helpers/period')
      , { groupByCode } = require('../../helpers/label')
      , linkify = this.props.linkify ? require('../../utils/linkify') : text => text
      , asURL = this.props.linkify ? makeLink : text => text
      , period = this.props.period
      , originalLabel = getOriginalLabel(period)
      , alternateLabels = getAlternateLabels(period)
      , simpleFields
      , noteFields
      , startString
      , stopString

    period = this.props.period;

    simpleFields = [
      {
        value: period.getIn(['source', 'locator']),
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
            { originalLabel.get('value') }
            {' '}
            ({ originalLabel.get('language') }-{ originalLabel.get('script') })
          </dd>
        </div>

        {
          alternateLabels.size > 0 && (
            <div className="field">
              <dt>Alternate labels</dt>
              <dd>
                <ul className="list-unstyled">
                  {
                    groupByCode(alternateLabels)
                      .map((labels, code) => labels.map(label => Immutable.Map({ label, code })))
                      .toList()
                      .flatten(1)
                      .map(label =>
                        <li key={label.hashCode()}>
                          { label.get('label') } ({ label.get('code') })
                        </li>
                      )
                  }
                </ul>
              </dd>
            </div>
          )
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
          period.has('spatialCoverage') && (
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
          )
        }

        <div className="field">
          <dt>Start</dt>
          <dd>
            <div>
              <span>{period.getIn(['start', 'label'], <em>(not given)</em>)}</span>
              {startString && <br />}
              <span>{startString && ('(ISO value: ' + startString + ')')}</span>
            </div>
          </dd>
        </div>

        <div className="field">
          <dt>Stop</dt>
          <dd>
            <div>
              <span>{period.getIn(['stop', 'label'], <em>(not given)</em>)}</span>
              {stopString && <br />}
              <span>{stopString && ('(ISO value: ' + stopString + ')')}</span>
            </div>
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
