"use strict";

const h = require('react-hyperscript')

const Crumb = ({ url, label }, i, crumbs) => {
  const last = i === crumbs.length - 1

  const props = { key: i }
  if (last) props.className = 'active';

  return (
    h('li', props, [
      last
        ? label
        : h('a', { href: url }, label)
    ])
  )
}

function Breadcrumb({ crumbs }) {
  return h('ol', crumps.map(Crumb))
}

Breadcrumb.propTypes = {
  crumbs: React.PropTypes.list
}

module.exports = Breadcrumb
