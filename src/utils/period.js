"use strict";

const h = require('react-hyperscript')
    , Immutable = require('immutable')
    , diff = require('fast-diff')
    , { getEarliestYear, getLatestYear } = require('../items').terminus

function addError(map, label, err) {
  return map.update(label, Immutable.List(), list => list.push(err));
}


function validate(period) {

  let errors = Immutable.Map()

  if (!period.get('label')) {
    errors = addError(errors, 'label', 'This field is required.');
  }

  const periodPresent = type =>
    period.get(type) &&
    period.getIn([type, 'label']) &&
    getEarliestYear(period.get(type)) !== null

  const badTerminusRange = terminus =>
    terminus.hasIn(['in', 'latestYear']) &&
    getEarliestYear(terminus) > getLatestYear(terminus)

  if (!periodPresent('start') || !periodPresent('stop')) {
    errors = addError(errors, 'dates', 'A period must have start and stop dates.');
  } else if (getLatestYear(period.get('stop')) < getEarliestYear(period.get('start'))) {
    errors = addError(errors, 'dates', 'A period\'s stop must come after its start.');
  } else {
    if (badTerminusRange(period.get('start'))) {
      errors = addError(errors, 'dates', 'Date range for period start has a beginning later than its end.')
    }

    if (badTerminusRange(period.get('stop'))) {
      errors = addError(errors, 'dates', 'Date range for period stop has a beginning later than its end.')
    }
  }

  return errors.size ? errors.toJS() : null;
}


function wrapTextLeaves(className, item) {
  return item instanceof Immutable.Iterable
    ? item.map(wrapTextLeaves.bind(null, className))
    : h('span', { className }, item)
}


function diffTree(from, to) {
  if (Immutable.is(from, to)) return from;

  if (to && from === undefined) return wrapTextLeaves('diff-addition', to);

  if (to === undefined && from) return wrapTextLeaves('diff-deletion', from);

  if (from instanceof Immutable.Map) {
    let diffed = Immutable.Map()

    const processEntry = (fromVal, toVal, key) => {
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
    return h('span', diff(from, to).map(diffToNode));
  }
}


function diffToNode([type, text]) {
  let className = ''

  const key = `k${Math.random()}`

  if (type === diff.INSERT) className = 'diff-addition';
  if (type === diff.DELETE) className = 'diff-deletion';

  return h('span', { className, key }, text);
}


module.exports = {
  validate,
  diffTree,
}
