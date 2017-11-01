"use strict";

const R = require('ramda')

function camelCase(str) {
  let camel = ''
    , wasHyphen = false

  for (const ch of str) {
    if (ch === '-') {
      wasHyphen = true;
      continue;
    }

    camel += (wasHyphen ? ch.toUpperCase() : ch)
    wasHyphen = false;
  }

  return camel
}

const BLOCK_WHITELIST = [
  'name',
  'gridRow',
  'gridColumn'
]

const LAYOUT_WHITELIST = [
  'gridGap',
  'gridTemplateColumns',
]

module.exports = function parse(string, opts={}) {
  const lines = string.split('\n')
      , len = lines.length

  const layout = { blocks: new Map() }

  const abort = message => {
    throw new Error(`Error on line ${len - lines.length}:\n${message}`)
  }

  let cur
    , currentBlock
    , currentBlockIdx = 0

  while ((cur = lines.shift()) !== undefined) {
    cur = cur.trim()
    if (!cur || cur.startsWith('#')) continue

    // New block
    if (cur[0] === '[') {
      if (!cur.endsWith(']')) {
        abort(
`\`${cur}\`is not a valid identifier for a block.
Names of blocks must begin with \`[\` and end with \`]\``
        )
      }

      let blockID = cur.slice(1,-1)

      if (!blockID) {
        blockID = '' + currentBlockIdx;
      }

      if (layout.blocks.has(blockID)) {
        abort(`\`${blockID}\` has already been used as a block identifier`)
      }

      currentBlock = { id: blockID};
      currentBlockIdx++;
      layout.blocks.set(blockID, currentBlock)
      continue
    }

    // Property
    const equalsIndex = cur.indexOf('=')
        , k = camelCase(cur.slice(0, equalsIndex).trim())
        , v = cur.slice(equalsIndex + 1).trim()

    if (equalsIndex <= 0 || !k || !v) {
      abort(
`Invalid property declaration in block \`[${currentBlock.id}]\`:

  ${cur}

A property declaration must begin with a sequence of characters, followed by an
equals sign, followed by a sequence of characters
        `
      )
    }

    if (currentBlock) {
      if (BLOCK_WHITELIST.includes(k)) {
        currentBlock[k] = v;
      } else {
        if (!currentBlock.opts) currentBlock.opts = {}
        currentBlock.opts[k] = v;
      }
    } else {
      if (LAYOUT_WHITELIST.includes(k)) {
        layout[k] = v;
      } else {
        if (!layout.opts) layout.opts = {}
        layout.opts[k] = v;
      }
    }

  }

  layout.blocks.forEach((block, id) => {
    if (!block.name) {
      throw new Error(`Invalid block definition in \`[${id}]\`. A \`name\` property is required.`)
    }
  })

  return R.evolve({ blocks: map => [...map.values()] }, layout)
}
