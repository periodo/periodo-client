"use strict";

// Given a set of limits and two x-coordinates for a line segment,
module.exports = function ([lowerLimit, upperLimit], [x1, x2], allWithin=false) {
  var lowerWithin = lowerLimit <= x1 && x1 <= upperLimit
    , upperWithin = lowerLimit <= x2 && x2 <= upperLimit

  if (allWithin) {
    return lowerWithin && upperWithin;
  } else {
    return lowerWithin || upperWithin || (x1 < lowerLimit && x2 > upperLimit);
  }
}
