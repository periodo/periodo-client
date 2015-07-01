"use strict";

var _ = require('underscore')
  , React = require('react')
  , Immutable = require('immutable')
  , diff = require('fast-diff')

function getOriginalLabel(period) {
  var originalLabel = period.get('originalLabel')
    , value = originalLabel.valueSeq().first()
    , [language, script] = originalLabel.keySeq().first().split('-')

  return Immutable.Map({ value, language, script });
}

function getAlternateLabels(period) {
  return period.get('alternateLabel', Immutable.List())
    .map((labels, isoCodes) => {
      var [language, script] = isoCodes.split('-');
      return labels.map(value => Immutable.Map({ value, language, script }))
    })
    .toList()
    .flatten(1)
}

function validate(period) {
  var { getEarliestYear, getLatestYear } = require('./terminus')
    , errors = {}

  function addError(label, err) { errors[label] = (errors[label] || []).concat(err) }

  if (!period.get('label')) {
    addError('label', 'This field is required.');
  }

  function periodPresent(type) {
    return (
      period.get(type) &&
      period.getIn([type, 'label']) &&
      !!getEarliestYear(period.get(type))
    )
  }

  if (!periodPresent('start') || !periodPresent('stop')) {
    addError('dates', 'A period must have start and stop dates.');
  } else if (getLatestYear(period.get('stop')) < getEarliestYear(period.get('start'))) {
    addError('dates', 'A period\'s stop must come after its start.');
  }

  return _.isEmpty(errors) ? null : errors;
}

function wrapTextLeaves(className, item) {
  debugger;
  return item instanceof Immutable.Iterable ?
    item.map(wrapTextLeaves.bind(null, className)) :
    <span className={className}>{item}</span>
}

function diffTree(from, to) {
  if (Immutable.is(from, to)) return from;

  if (to && from === undefined) return wrapTextLeaves('diff-addition', to);

  if (to === undefined && from) return wrapTextLeaves('diff-deletion', from);

  if (from instanceof Immutable.Map) {
    let diffed = Immutable.Map()
      , processEntry

    processEntry = (fromVal, toVal, key) => {
      if (toVal instanceof Immutable.List) {
        toVal = toVal.toSet();
        fromVal = fromVal.toSet();
      }

      diffed = diffed.set(key, diffTree(fromVal, toVal));
    }

    to.forEach((toVal, key) => processEntry(from.get(key), toVal, key));
    from.filter((val, key) => !to.has(key))
      .forEach((fromVal, key) => processEntry(fromVal, undefined, key))

    return diffed;
  }

  if (from instanceof Immutable.Set) {
    let diffed = Immutable.List()

    diffed = diffed.concat(from.subtract(to).map(wrapTextLeaves.bind(null, 'diff-deletion')));
    diffed = diffed.concat(to.subtract(from).map(wrapTextLeaves.bind(null, 'diff-addition')));
    diffed = diffed.concat(to.intersect(from));

    return diffed
  }

  if (typeof from === 'string') {
    return <span>{diff(from, to).map(diffToNode)}</span>;
  }
}

function diffToNode([type, text]) {
  var className = ''

  if (type === diff.INSERT) className = 'diff-addition';
  if (type === diff.DELETE) className = 'diff-deletion';

  return <span key={'k' + Math.random()} className={className}>{text}</span>
}

module.exports = { validate, getOriginalLabel, getAlternateLabels, diffTree }
