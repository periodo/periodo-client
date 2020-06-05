"use strict";

const h = require('react-hyperscript')
    , { Flex, Box } = require('./Base')

const TabItem = ({
  i,
  label,
  isSelected,
  isLast,
  onClick,
  ...rest
}) =>
  h(Box, {
    sx: {
      p: 2,
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: 'gray.4',
      fontSize: 1,
      fontWeight: 'bold',
      textAlign: 'center',
      flexGrow: 1,
      marginLeft: i > 0 ? '-1px' : 0,
      marginRight: isLast ? '1px' : 0,
      ...(isSelected
        ? {
          borderBottomColor: 'transparent',
        }
        : {
          cursor: 'pointer',
          backgroundColor: '#eee',
          ':hover': {
            backgroundColor: '#ccc',
          },
        }),
    },
    onClick,
    ...rest,
  }, label)

const TabSpacer = ({ isLast, ...rest }) =>
  h(Box, {
    sx: {
      marginLeft: '-1px',
      width: isLast ? 0 : '16px',
      height: '34px',
      borderBottomStyle: 'solid',
      borderBottomWidth: 1,
      borderBottomColor: 'gray.4',
    },
    ...rest,
  })

exports.Tabs = ({
  tabs,
  value,
  onChange,
  ...rest
}) =>
  h(Box, {
    ...rest,
  }, [
    h(Flex, {
      alignItems: 'center',
    }, tabs.map(({ id, label }, i) => [
      h(TabItem, {
        i,
        key: id,
        label,
        isSelected: value === id,
        isLast: i === tabs.length - 1,
        onClick: () => onChange(id),
      }),
      h(TabSpacer, {
        isLast: i === tabs.length - 1,
      }),
    ]).flat()),

    h(Box, tabs.map(({ id, renderTab }) =>
      value !== id ? null : (
        h(Box, {
          key: id,
          sx: {
            border: 1,
            borderTop: 0,
            borderColor: 'gray.4',
          },
        }, renderTab())
      )
    )),
  ])
