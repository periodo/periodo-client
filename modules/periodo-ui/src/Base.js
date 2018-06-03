"use strict";

const h = require('react-hyperscript')
    , styled = require('styled-components').default
    , ss = require('styled-system')
    , tag = require('clean-tag').default

const fns = [
  ss.display,
  ss.space,
  ss.color,
  ss.borders,
  ss.borderColor,
  ss.borderRadius,

  ss.fontWeight,
  ss.fontSize,

  ss.width,
  ss.height,
  ss.maxWidth,
  ss.maxHeight,
  ss.minWidth,
  ss.minHeight,

  ss.alignSelf,
  ss.flex,
  ss.textAlign,
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
  2: '1.7rem',
  3: '1.5rem',
  4: '1.1rem',
  5: '0.9rem',
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

const ResourceTitle = props => h(Heading, Object.assign({
  level: 2,
  mb: 3,
}, props))



const Span = styled(tag.span)([], [
  ...fns,
])

const Text = styled(tag.p)([], [
  ...fns,
])

module.exports = {
  Box,
  Flex,
  Grid,
  Pre,
  Heading,
  ResourceTitle,
  Span,
  Text,
}
