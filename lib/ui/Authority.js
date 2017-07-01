"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Period } = require('./Period')
    , { Source } = require('./Source')
    , { FieldList, getFields } = require('./Field')
    , { Link, LinkifiedText } = require('./Misc')
    , { extract, as } = require('../util/misc')

const extractDefinitions = R.pipe(
  R.propOr({}, 'definitions'),
  R.values,
)

const AUTHORITY_FIELDS = [
  {
    label: 'Permalink',
    values: as('url')(extract('id')),
    valueComponent: Link,
    required: true,
    immutable: true,
  },
  {
    label: 'Type',
    values: extract('type'),
    required: true,
    immutable: true,
    hidden: true,
  },
  {
    label: 'Source',
    values: extract('source'),
    valueComponent: Source,
    diffInside: true,
  },
  {
    label: 'Editorial notes',
    values: as('text')(extract('editorialNote')),
    valueComponent: LinkifiedText,
    diffInside: true,
  },
  {
    label: 'Same as',
    values: as('url')(extract('sameAs')),
    valueComponent: Link,
  },
  { label: 'Period definitions',
    values: as('period')(extractDefinitions),
    valueComponent: props => h(
      Period,
      R.merge(props,
        { m: 1, borderTop: 'thin solid', borderColor: 'Gainsboro' }
      ),
    ),
    diffInside: true,
  },
]

const fields = getFields(AUTHORITY_FIELDS)

exports.Authority = function Authority(props) {
  const { authority, changed = {} } = props
  return h(
    FieldList,
    R.merge(
      R.omit(['authority', 'changed'], props),
      { fields: fields(authority)
      , changed: changed.authority ? { fields: fields(changed.authority) } : {}
      }
    ),
  )
}
