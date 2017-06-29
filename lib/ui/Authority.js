"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , { Period } = require('./Period')
    , { Source } = require('./Source')
    , { Field, getFields } = require('./Field')
    , { Link, LinkifiedText } = require('./Misc')
    , { extract, as } = require('../util/misc')

const extractDefinitions = R.pipe(
  R.propOr({}, 'definitions'),
  R.values,
)

const AUTHORITY_FIELDS = [
  {
    label: 'Source',
    values: extract('source'),
    valueComponent: Source,
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
  },
]

const fields = getFields(AUTHORITY_FIELDS)

exports.Authority = function Authority(props) {
  const { authority } = props
  return h(
    Box,
    R.merge(R.omit(['authority'], props), { is: 'dl' }),
    R.map(Field, fields(authority))
  )
}
