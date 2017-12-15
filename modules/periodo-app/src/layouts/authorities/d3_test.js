"use strict";

const d3 = require('d3')
    , R = require('ramda')
    , { blocks } = require('org-layouts')
    , { earliestYear, latestYear } = require('periodo-utils/src/terminus')

const d = {
  MARGIN: 20,
  HEIGHT: 500,
  WIDTH: 500,
}

const MIN_HEIGHT = 420

module.exports = blocks.DOM({
  label: 'D3 test',
  description: 'd3 component with init/update/destroy methods',
  steps: 1000,
  next(prev=[], items) {
    return prev.concat(...items.map(authority =>
      R.values(authority.definitions)
    ))
  },

  init(el) {
    this.el = el;

    this.svg = d3.select(el)
      .append('svg')
      .attr('height', MIN_HEIGHT)

    this.g = this.svg
      .append('g')
        .attr('transform', `translate(${d.MARGIN,d.MARGIN})`)

    this.periodsGBackground = this.g.append('rect')
    this.periodsG = this.g.append('g')
  },

  setDimensions() {
    const { width, height } = this.el.getBoundingClientRect()

    this.svg
      .attr('width', width + 2 * d.MARGIN)
      .attr('height', height + 2 * d.MARGIN)

    this.scale = {
      x: d3.scaleLinear().range([0, width - 2 * d.MARGIN]),
      y: d3.scaleLinear().range([height, 0]),
    }

    this.periodsGBackground
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width - 2 * d.MARGIN)
      .attr('height', height)
      .attr('fill', '#f9f9f9')

    this.axisG = {
      x: this.g.append('g')
        .attr('transform', `translate(0,${height})`)
    }

    this.rendered = true;


  },

  getXAxis() {
    return d3.axisBottom()
      .scale(this.scale.x)
      .ticks(5)
      .tickFormat(R.cond([
        // Pre-late stone age (50,000 BC): use SI notation for how many years
        // ago it was, with 'a' as a suffix:
        //
        //   * ka (thousand years ago)
        //   * Ma (million years ago)
        //   * Ga (billion years ago)
        [R.gt(-50000), R.pipe(
          R.subtract(new Date().getFullYear()),
          d3.format('.1s'),
          R.flip(R.concat)('a')
        )],

        // Late stone age to ISO8601 year -1: Tack on 'BC'. Add commas
        // for 10,000 to 50,000.
        [R.gte(-1), R.pipe(
          d => Math.abs(d),
          R.ifElse(R.lte(10000), d3.format(','), R.toString),
          R.flip(R.concat)('BC'),
        )],

        // Otherwise, just return the string. (e.g. 1243, 466, 1999). This
        // would not make sense for far-future dates
        [R.T, R.toString]
      ]))
  },

  update(periods) {
    let min = Infinity
      , max = -Infinity

    const _periods = []

    if (!this.rendered) this.setDimensions()

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

    this.axisG.x.transition().duration(256).call(this.getXAxis())

    const rects = this.periodsG
      .selectAll('rect')
      .data(periods, d => d.id)

    rects.exit()
      .transition()
        .duration(250)
        .ease(d3.easeSin)
        .style('opacity', 0)
      .transition()
        .remove()

    const width = (d, i) => {
      let w = this.scale.x(_periods[i][1]) - this.scale.x(_periods[i][0])

      if (w < 1) w = 1;

      return w;
    }

    const height = () => {
      const h = this.scale.y(periods.length - .85)

      return h >= 1 ? h : 1;
    }

    const x = (d, i) => this.scale.x(_periods[i][0])
        , y = (d, i) => this.scale.y(i + 1)

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
  },
})
