"use strict";

const d3 = require('d3')

module.exports = class BarVisualization {
  update({
    xScale,
    yScale,
    group,
    periodsWithEndpoints,
  }) {
    const rects = group
      .selectAll('rect')
      .data(periodsWithEndpoints, d => d.period.id)

    rects.exit()
      .transition()
        .duration(250)
        .ease(d3.easeSin)
        .style('opacity', 0)
      .transition()
        .remove()

    const width = d => {
      let w = xScale(d.latest) - xScale(d.earliest)

      if (w < 1) w = 1;

      return w;
    }

    const height = () => {
      const h = yScale(periodsWithEndpoints.length - .85)

      return h >= 1 ? h : 1;
    }

    const x = d => xScale(d.earliest)
        , y = (d, i) => yScale(i + 1)

    const t = d3.transition()
      .duration(400)
      .ease(d3.easeSin)

    rects
      .transition(t)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)

    rects.enter()
      .append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('fill', d3.schemeCategory10[0])
      .attr('height', height)
      .style('opacity', 0)
      .transition()
        .delay(this.notFirst ? 350 : 0)
        .duration(500)
        .ease(d3.easeSin)
      .style('opacity', 1)

    this.notFirst = true;
  }
}

