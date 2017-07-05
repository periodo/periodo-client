"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , { Authority } = require('./Authority')
    , { FieldList
      , getFields
      , compareImmutableValues
      , showChanges
      } = require('./Field')
    , { Link } = require('./Misc')
    , { extract, as } = require('../util/misc')


function Pre(props) {
  return h(
    Box,
    R.merge(props, { is: 'pre' }),
    props.children
  )
}

function Entry(props) {
  const { entry } = props
  return h(
    Box,
    R.omit(['entry'], props),
    `  "${entry[0]}": ${JSON.stringify(entry[1])},`
  )
}

function Context(props) {
  const { context, changed = {} } = props
  return h(
    Pre,
    R.merge(R.omit(['context', 'changed'], props), { is: 'pre' }),
    [
      h(Box, { is: 'pre' }, '{'),

      ...changed.context
        ? showChanges(Entry)(compareImmutableValues(
            as('entry')(R.toPairs)(context),
            as('entry')(R.toPairs)(changed.context)
          ))
        : h(Box, {}, JSON.stringify(context, null, '  ')),

      h(Box, { is: 'pre' }, '}'),
    ]
  )
}

const extractAuthorities = R.pipe(
  R.propOr({}, 'periodCollections'),
  R.values,
)

const DATASET_FIELDS = [
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
    label: 'Context',
    values: as('context')(extract('@context')),
    valueComponent: Context,
    required: true,
    immutable: true,
    hidden: true,
    diffInside: true,
  },
  { label: 'Authorities',
    values: as('authority')(extractAuthorities),
    valueComponent: props => h(
      Authority,
      R.merge(props,
        { m: 1, borderTop: 'thin solid', borderColor: 'Gainsboro' }
      ),
    ),
    diffInside: true,
    hideUnchanged: true,
  },
]

const fields = getFields(DATASET_FIELDS)

exports.Dataset = function Dataset(props) {
  // Have to call the prop `dset` not `dataset` because of this:
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
  const { dset, changed = {} } = props
  return h(
    FieldList,
    R.merge(
      R.omit(['dset', 'changed'], props),
      { fields: fields(dset)
      , changed: changed.dset ? { fields: fields(changed.dset) } : {}
      }
    ),
  )
}
