"use strict"

const d3 = require('d3')

function getIntervalPoints(periodsWithEndpoints) {
  let intervalPoints = new Set()

  periodsWithEndpoints.forEach(({ earliest, latest }) => {
    intervalPoints.add(earliest)
    intervalPoints.add(latest)
  })

  intervalPoints = [ ...intervalPoints ]

  intervalPoints.sort((a, b) => a - b)

  return intervalPoints
}

function countIntervals(periodsWithEndpoints) {
  const intervalPoints = getIntervalPoints(periodsWithEndpoints)

  const intervals = new Map()
      , selectedPoints = new Set()

  let maxCount = 0

  periodsWithEndpoints.forEach(({ earliest, latest, selected }) => {
    const start = intervalPoints.indexOf(earliest)
        , end = intervalPoints.indexOf(latest)

    // increase counts from start to one less than end
    for (let i = start; i < end; i++) {
      const intervalKey = intervalPoints[i]
          , curCount = intervals.get(intervalKey) || 0
          , nextCount = curCount + 1

      intervals.set(intervalKey, nextCount)

      if (selected) {
        selectedPoints.add(intervalKey)
      }

      if (nextCount > maxCount) {
        maxCount = nextCount
      }
    }
  })


  const selectedIntervals = new Map(
    [ ...selectedPoints ].map(point =>
      [ point, intervals.get(point) ]))

  if (selectedPoints.size > 0) {
    const lastPoint = [ ...selectedPoints ].pop()

    // Extend this interval to the next interval point, which will be the
    // latest year of the period. But the y coordinate will be 0 rather than
    // the count of that interval (to close the path).
    selectedIntervals.set(
      intervalPoints[intervalPoints.indexOf(lastPoint) + 1],
      0)
  }


  // Delete the last one because it will never have anything in it
  intervals.delete(intervalPoints.pop())

  return {
    intervals,
    selectedIntervals,
    maxCount,
  }
}

function makePath(intervals, xScale, yScale) {
  const path = d3.path()
      , initialYear = intervals.keys().next().value

  let curX = xScale(initialYear)
    , curY = yScale(0)

  path.moveTo(curX, curY)

  Array.from(intervals).forEach(([ point, count ]) => {
    // Move horizontally to the current year
    path.lineTo(
      (curX = xScale(point)),
      curY)

    // Move up vertically to the current count
    path.lineTo(
      curX,
      (curY = yScale(count)))
  })

  // Move to the bottom
  path.lineTo(curX, yScale(0))

  // Move to the original point
  path.closePath()

  return path
}

module.exports = class FrequencyVisualization {
  update({
    xScale,
    yScale,
    group,
    periodsWithEndpoints,
  }) {
    const {
      intervals,
      selectedIntervals,
      maxCount,
    } = countIntervals(periodsWithEndpoints)

    yScale = yScale.copy().domain([
      0,
      maxCount > 20 ? maxCount : 20,
    ])

    group.selectAll('path').remove()

    if (intervals.size > 0) {
      const path = makePath(intervals, xScale, yScale)

      group
        .append('path')
        .attr('d', path.toString())
        .attr('stroke', 'none')
        .attr('fill', '#bbb')
    }

    if (selectedIntervals.size > 0) {
      const selectedPath = makePath(selectedIntervals, xScale, yScale)

      group.append('path')
        .attr('d', selectedPath.toString())
        .attr('stroke', 'red')
        .attr('stroke-width', 'red')
        .attr('fill', 'red')
    }
  }
}
