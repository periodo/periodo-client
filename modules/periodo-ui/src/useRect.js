"use strict";

const { useLayoutEffect, useCallback, useState } = require('react')
    , debounce = require('debounce')

// from https://gist.github.com/morajabi/523d7a642d8c0a2f71fcfa0d8b3d2846

module.exports = ref => {

  const [ rect, setRect ] = useState(getRect(ref ? ref.current : null))

  const handleResize = useCallback(() => {
    if (!ref.current) {
      return
    }
    setRect(getRect(ref.current))
  }, [ ref ])

  const debouncedHandler = debounce(handleResize, 200)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    handleResize()

    if (typeof ResizeObserver === 'function') { // Chrome
      let resizeObserver = new ResizeObserver(() => handleResize())
      resizeObserver.observe(element)
      return () => {
        if (!resizeObserver) {
          return
        }
        resizeObserver.disconnect()
        resizeObserver = null
      }
    } else { // other browsers
      window.addEventListener('resize', debouncedHandler)
      return () => {
        window.removeEventListener('resize', debouncedHandler)
      }
    }
  }, [ ref.current ])

  return rect
}

function getRect(element) {
  if (!element) {
    return {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
    }
  }
  return element.getBoundingClientRect()
}
