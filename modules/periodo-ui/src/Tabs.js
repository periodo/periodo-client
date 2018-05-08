"use strict";

const h = require('react-hyperscript')
    , { Flex, Box } = require('./Base')

const TabItem = ({ label, isSelected, isLast, onClick }) =>
  h(Box, {
    p: 2,
    center: true,
    border: 1,
    borderColor: 'gray4',
    onClick,
    fontSize: 4,
    css: Object.assign({
      borderRadius: '6px 6px 0 0',
      flexGrow: 1,
      marginRight: isLast ? 0 : -1,
      fontWeight: 'bold',
    }, isSelected
      ? {
          borderBottomColor: 'transparent'
        }
      : {
          cursor: 'pointer',
          backgroundColor: '#eee',
          ':hover': {
            backgroundColor: '#ccc',
          }
        }
    )
  }, label)

exports.Tabs = props =>
  h(Box, [
    h(Flex, {
      alignItems: 'center',
    }, props.tabs.map(({ id, label }, i) =>
      h(TabItem, {
        key: id,
        label,
        isSelected: props.value === id,
        isLast: i === props.tabs.length - 1,
        onClick: () => props.onChange(id),
      })
    )),

    h(Box, props.tabs.map(({ id, element }) => 
      h(Box, {
        key: id,
        p: 2,
        border: 1,
        borderTop: 0,
        borderColor: 'gray4',
        display: props.value === id ? 'none' : 'block'
      }, element)
    ))
  ])
