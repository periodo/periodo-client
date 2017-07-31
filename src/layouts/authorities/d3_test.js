"use strict";

const d3 = require('d3')
    , R = require('ramda')
    , DOMLayout = require('lib/layout-engine/D3Layout')
    , { earliestYear, latestYear } = require('lib/util/terminus')

const d = {
  MARGIN: 30,
  HEIGHT: 500,
  WIDTH: 500,
}

module.exports = {
  label: 'D3 test',
  description: 'd3 component with init/update/destroy methods',
  Component: DOMLayout({
    init(el) {
      this.svg = d3.select(el)
        .append('svg')
          .attr('width', d.WIDTH + 2 * d.MARGIN)
          .attr('height', d.HEIGHT + 2 * d.MARGIN)

      this.g = this.svg
        .append('g')
          .attr('transform', `translate(${d.MARGIN,d.MARGIN})`)

      this.scale = {
        x: d3.scale.linear().range([0, d.WIDTH]),
        y: d3.scale.linear().range([d.HEIGHT, 0]),
      }

      this.axis = {
        x: d3.svg.axis()
          .orient('bottom')
          .scale(this.scale.x)
          .ticks(5)
      }

      this.axisG = {
        x: this.g.append('g')
          .attr('transform', `translate(0,${d.HEIGHT})`)
      }

      this.periodsG = this.g.append('g')


    },

    update(periods) {
      let min = Infinity
        , max = -Infinity

      const _periods = []

      periods = R.sortBy(p => earliestYear(p.start), periods)

      periods.forEach(period => {
        const earliest = earliestYear(period.start)
            , latest = latestYear(period.stop)

        if (earliest != null && earliest < min) min = earliest;
        if (latest != null && latest > max) max = latest

        _periods.push([earliest, latest])
      })

      this.scale.x.domain([min, max])
      this.scale.y.domain([0, periods.length])

      this.axisG.x.transition().call(this.axis.x)

      this.periodsG.selectAll('rect')
        .data(periods)
          .enter()
        .append('rect')
        .attr('x', (d, i) => this.scale.x(_periods[i][0]))
        .attr('width', (d, i) => this.scale.x(_periods[i][1]) - this.scale.x(_periods[i][0]))
        .attr('y', (d, i) => this.scale.y(i + 1))
        .attr('height', () => {
          let h = d.HEIGHT / periods.length - 1

          if (h < 1) h = 1

          return h
        })
        .attr('fill', 'blue')
    },

    next(prev=[], items) {
      return prev.concat(...items.map(authority =>
        R.values(authority.definitions)
      ))
    },

    steps: Infinity,
  })
}
