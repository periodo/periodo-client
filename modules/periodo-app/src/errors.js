"use strict";

function NotFoundError(message) {
  this.name = 'NotFoundError';
  this.message = message || 'Object not found';
  this.stack = Error().stack;
}
NotFoundError.prototype = Object.create(Error.prototype);
NotFoundError.prototype.constructor = NotFoundError;


function NotImplementedError(message) {
  this.name = 'NotFoundError';
  this.message = message || 'Method not implemented.';
  this.stack = Error().stack;
}
NotImplementedError.prototype = Object.create(Error.prototype);
NotImplementedError.prototype.constructor = NotImplementedError;

module.exports = {
  NotFoundError,
  NotImplementedError,
}
