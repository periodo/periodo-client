"use strict";

const h = require('react-hyperscript')
    , { Flex, Box } = require('./Base')

const TabItem = ({ i, label, isSelected, isLast, onClick }) => h(Box, {
  p: 2,
  border: 1,
  borderColor: 'gray.4',
  onClick,
  fontSize: 1,
  textAlign: 'center',
  css: {
    textAlign: 'center',
    flexGrow: 1,
    marginLeft: i > 0 ? '-1px' : 0,
    marginRight: isLast ? '1px' : 0,
    fontWeight: 'bold',
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
}, label)

const TabSpacer = ({ isLast }) => h(Box, {
  width: isLast ? 0 : '16px',
  height: '36px',
  borderBottom: 1,
  borderColor: 'gray.4',
  css: { marginLeft: '-1px' },
})

exports.Tabs = props =>
  h(Box, [

    h(Flex, {
      alignItems: 'center',
    }, props.tabs.map(({ id, label }, i) => [
      h(TabItem, {
        i,
        key: id,
        label,
        isSelected: props.value === id,
        isLast: i === props.tabs.length - 1,
        onClick: () => props.onChange(id),
      }),
      h(TabSpacer, {
        isLast: i === props.tabs.length - 1,
      }),
    ]).flat()),

    h(Box, props.tabs.map(({ id, renderTab }) =>
      props.value !== id ? null : (
        h(Box, {
          key: id,
          border: 1,
          borderTop: 0,
          borderColor: 'gray.4',
        }, renderTab())
      )
    )),
  ])
