"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , styled = require('styled-components').default
    , { themeGet } = require('styled-components')
    , ss = require('styled-system')
    , tag = require('clean-tag').default

const fns = [
  ss.display,
  ss.space,
  ss.color,
  ss.borders,

  ss.width,
  ss.height,
  ss.maxWidth,
  ss.maxHeight,
  ss.minWidth,
  ss.minHeight,

  ss.alignSelf,
  ss.flexGrow,
]

const Box = styled(tag)([], [
  ...fns,
  props => Object.assign({}, props.css),
])

Box.defaultProps = {
  blacklist: Object.keys(ss.propTypes).concat([
    'css',
  ])
}

const Pre = styled(tag.pre)([], [
  ...fns,
  {
    whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
  },
])

const Flex = Box.extend([], [
  { display: 'flex' },
  ss.alignItems,
  ss.justifyContent,
  ss.flexWrap,
  ss.flexDirection,
])

const Grid = Box.extend([], [
  { display: 'grid' },
  ss.gridTemplateColumns,
  ss.gridTemplateRows,
])

const tagsForLevel = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
}

const sizeForLevel = {
  1: '2.2rem',
  2: '2rem',
  3: '1.6rem',
  4: '1.2rem',
  5: '1.0rem',
  6: '0.8rem',
}

const _Heading = props => {
  const tag = tagsForLevel[props.level] || 'h1'

  return h(tag, props)
}

const Heading = styled(_Heading)([], [
  ...fns,
  props => ({
    fontWeight: 'bold',
    fontSize: sizeForLevel[props.level] || '12px',
  })
])



const Label = Box
const Select = Box
const Span = Box
const Text = Box
const Textarea = Box

module.exports = {
  Box,
  Flex,
  Grid,
  Pre,
  Heading,
  Label,
  Select,
  Span,
  Text,
  Textarea,
}
