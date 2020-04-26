"use strict"

const CIRCLE_RADIUS = 2

function inBin(bin, earliest, latest) {
  return (
    (bin.min >= earliest && bin.min <= latest) ||
    (bin.max >= earliest && bin.max <= latest) ||
    (earliest >= bin.min && earliest <= bin.max) ||
    (latest >= bin.min && latest <= bin.max)
  )
}

module.exports = class HistogramVisualization {
  getBins(xScale, yScale, periodsWithEndpoints) {
    const width = xScale.range()[1] - xScale.range()[0]
        , height = yScale.range()[0] - yScale.range()[1]
        , numXBins = Math.floor(width / (CIRCLE_RADIUS * 2))

    let numYBins = Math.floor(height / (CIRCLE_RADIUS * 2))

    const xBinScale = xScale.copy().range([ 0, numXBins ])

    if (isNaN(xBinScale.invert(1))) return []

    const xBins = new Array(numXBins).fill().map((_ , i) => ({
      min: xBinScale.invert(i),
      max: xBinScale.invert(i + 1),
      periods: [],
      highlight: false,
    }))

    let startWithBin = 0
      , maxCount = 0

    periodsWithEndpoints.forEach(({ period, earliest, latest, selected }) => {
      while (earliest != null && latest != null && !inBin(xBins[startWithBin], earliest, latest)) {
        startWithBin++
      }

      let binIdx = startWithBin

      do {
        const count = xBins[binIdx].periods.push(period)
        if (count > maxCount) maxCount = count
        if (selected) {
          xBins[binIdx].highlight = true
        }
        binIdx++
      } while (binIdx < xBins.length && inBin(xBins[binIdx], earliest, latest))
    })

    if (maxCount < 5) {
      numYBins = numYBins / 2
    }

    const bins = []

    xBins.forEach(({ periods, highlight }, i) => {
      if (!periods.length) return

      let yBins = Math.floor((periods.length / maxCount) * numYBins)

      if (yBins === 0) yBins = 1

      // TODO HERE
      for (let j = 0; j < yBins; j++) {
        bins.push({
          cx: CIRCLE_RADIUS + (i * 2 * CIRCLE_RADIUS),
          cy: height - (CIRCLE_RADIUS + (j * 2 * CIRCLE_RADIUS)),
          highlight,
        })
      }
    })

    return bins
  }

  update({
    xScale,
    yScale,
    group,
    periodsWithEndpoints,
  }) {

    const bins = this.getBins(xScale, yScale, periodsWithEndpoints)

    group.selectAll('circle').remove()

    group
      .selectAll('circle')
      .data(bins)
      .enter()
      .append('circle')
      .attr('cx', d => d.cx)
      .attr('cy', d => d.cy)
      .attr('r', CIRCLE_RADIUS)
      .attr('fill', d => d.highlight ? '#ff000080' : '#bbb')
  }
}
