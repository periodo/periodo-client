"use strict";

const h = require('react-hyperscript')
    , { Flex, Box } = require('axs-ui')

const TabItem = ({ key, label, isSelected, isLast, onClick }) =>
  h(Box, {
    key,
    p: 2,
    center: true,
    border: 1,
    borderColor: 'gray4',
    onClick,
    css: Object.assign({
      borderRadius: '6px 6px 0 0',
      flexGrow: 1,
      marginRight: isLast ? 0 : -1,
    }, isSelected
      ? {
          borderBottomColor: 'transparent'
        }
      : {
          cursor: 'pointer',
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
    }, props.tabs.map(({ key, label }, i) =>
      h(TabItem, {
        key,
        label,
        isSelected: props.value === key,
        isLast: i === props.tabs.length - 1,
        onClick: () => props.onChange(key),
      })
    )),

    h(Box, props.tabs.map(({ key, element }) => 
      h(Box, {
        key,
        p: 2,
        border: 1,
        borderTop: 0,
        borderColor: 'gray4',
        display: props.value === key ? 'none' : 'block'
      }, element)
    ))
  ])
