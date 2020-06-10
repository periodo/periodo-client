"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Text } = require('rebass')
    , ss = require('styled-system')
    , styled = require('@emotion/styled').default


const Pre = props =>
  h(Box, {
    as: 'pre',
    sx: {
      whiteSpace: 'pre-wrap',
      fontFamily: 'monospace',
    },
    ...props,
  })

const Grid = styled(Box)(
  { display: 'grid' },
  ss.grid
)

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

const Heading = props => {
  const { level=1 } = props
      , tag = tagsForLevel[level]

  return (
    h(Text, {
      as: tag,
      sx: {
        fontWeight: 'bold',
        fontSize: sizeForLevel[level],
      },
      ...props,
    })
  )
}

const ResourceTitle = props =>
  h(Heading, {
    level: 2,
    mb: 3,
    ...props,
  })

const SectionHeading = props =>
  h(Heading, {
    level: 3,
    pt: 2,
    pb: 1,
    color: 'colorsets.primary.fg',
    ...props,
  })

const Section = props =>
  h(Box, {
    className: 'section',
    sx:  {
      p: 3,
      mb: 4,
      bg: 'colorsets.primary.bg',
      color: 'colorsets.primary.fg',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: 'colorsets.primary.border',
    },
    ...props,
  })

const Span = props =>
  h(Box, {
    as: 'span',
    ...props,
  })

const HelpText = props =>
  h(Text, {
    sx: {
      fontSize: 1,
      color: 'gray.7',
      mb: 1,
    },
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
