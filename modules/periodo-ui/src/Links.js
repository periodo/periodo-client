"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Text } = require('axs')
    , { Route, trigger } = require('periodo-app/src/router')

exports.Link = props => {
  const isInternal = props.href instanceof Route
      , href = isInternal ? props.href.url() : props.href

  return h(Text, Object.assign({
    is: 'a',
    color: 'blue',
    href,
    _css: {
      textDecoration: 'none',
      ':hover': {
        textDecoration: 'underline'
      }
    }
  }, isInternal && {
    onClick: e => {
      if (e.ctrlKey || e.shiftKey) return

      e.preventDefault();
      trigger(props.href);
    }
  }, R.omit(['href'], props)), props.children)
}
