"use strict";

module.exports = class BarVisualization {
  update({
    xScale,
    yScale,
    group,
    periodsWithEndpoints,
  }) {

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

    const fill = d => d.selected ? '#ff000080' : '#bbb'

    group.selectAll('rect').remove()

    group
      .selectAll('rect')
      .data(periodsWithEndpoints, d => d.period.id)
      .enter()
      .append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('fill', fill)
      .attr('height', height)
      .style('opacity', 1)
  }
}
