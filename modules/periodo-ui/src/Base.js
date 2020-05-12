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
  ss.lineHeight,

  ss.alignSelf,
  ss.flex,
  ss.textAlign,
  ss.verticalAlign,

  ss.position,
  ss.layout,
]

const Box = styled(tag)([], [
  ...fns,
  props => ({ ...props.css }),
])

Box.defaultProps = {
  blacklist: Object.keys(ss.propTypes).concat([
    'css',
  ]),
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
    fontSize: props.fontSize || sizeForLevel[props.level] || '12px',
  }),
])

const ResourceTitle = props => h(Heading, {
  level: 2,
  mb: 3,
  ...props,
})

const SectionHeading = props => h(Heading, {
  level: 3,
  mt: 2,
  mb: 2,
  ...props,
})

const Section = props => h(Box, {
  p: 3,
  mb: 3,
  bg: 'white',
  className: 'section',
  css: {
    '.block + .block': {
      marginTop: '16px',
    },
  },
  ...props,
})

const Span = styled(tag.span)([], [
  ...fns,
])

const Text = styled(tag.p)([], [
  ...fns,
])

const HelpText = props => h(Text, {
  size: 1,
  color: 'gray.7',
  mb: '4px',
  ...props,
})


module.exports = {
  Box,
  Flex,
  Grid,
  Heading,
  HelpText,
  Pre,
  ResourceTitle,
  Section,
  SectionHeading,
  Span,
  Text,
}
