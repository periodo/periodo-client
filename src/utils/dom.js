"use strict";

function isChild(el, ofEl) {
  var is = false;

  do {
    is = el === ofEl;
    if (is) break;
  } while ((el = el.parentNode));

  return is;
}

module.exports = { isChild }
