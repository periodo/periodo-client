"use strict";

// Dumb sanity check: Make sure that all keys are identical to their values.
module.exports = function validateAndFreezeTypeObj(obj) {
  const ret = {}

  Object.keys(obj).forEach(key => {
    if (key !== obj[key]) {
      throw new Error(`The key "${key}" does not match its value ("${obj[key]}").`);
    }

    ret[key] = key;
  })

  return Object.freeze(obj);
}
