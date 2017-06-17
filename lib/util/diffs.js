const diff = require('fast-diff')

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
  diffTree,
}

