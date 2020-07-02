"use strict";

const R = require('ramda')
    , { PatchType } = require('./types')

function groupByChangeType(patches) {
  let ret = {}

  patches.forEach(patch => {
    const type = PatchType.fromPatch(patch)

    const authorityID = a => [ type._name, a ]
        , periodID = (a, b) => [ type._name, a, b ]
        , topLevel = () => [ type._name ]

    const path = type.case({
      AddPeriod: authorityID,
      RemovePeriod: authorityID,
      ChangePeriod: periodID,
      ChangeAuthority: authorityID,
      _: topLevel,
    })

    ret = R.over(
      R.lensPath(path),
      (arr=[]) => [ ...arr, patch ],
      ret
    )
  })

  return ret
}

function getOrcids(patches) {
  return R.pipe(
    R.chain(patch => [].concat(
      patch.created_by,
      patch.comments.map(comment => comment.author)
    )),
    R.uniq
  )(patches)
}


module.exports = {
  groupByChangeType,
  getOrcids,
}
