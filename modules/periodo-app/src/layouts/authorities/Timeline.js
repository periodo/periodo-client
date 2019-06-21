"use strict";

const h = require('react-hyperscript')
    , d3 = require('d3')
    , R = require('ramda')
    , React = require('react')
    , { earliestYear, latestYear } = require('periodo-utils/src/terminus')

const d = {
  MARGIN: 20,
  HEIGHT: 500,
  WIDTH: 500,
}

function roundToUnit(num, unit, floor=true) {
  let multiplier = Math.floor(num / unit)

  multiplier = floor
    ? Math.floor(multiplier) - 1
    : Math.ceil(multiplier) + 1

  return unit * multiplier
}

function domainUnit(num, floor=true) {
  if (Math.abs(num) > 1000000) return num

  const pow = num.toString().length

  let unit = Math.pow(10, pow - 2)

  if (unit <= 1) unit = 10

  return roundToUnit(num, unit * .5, floor)
}

const yaTickFormat = R.cond([
  // Pre-late stone age (50,000 BC): use SI notation for how many years
  // ago it was, with 'a' as a suffix:
  //
  //   * ka (thousand years ago)
  //   * Ma (million years ago)
  //   * Ga (billion years ago)
  [R.gt(-50000), R.pipe(
    R.subtract(new Date().getFullYear()),
    d3.format('.2s'),
    R.flip(R.concat)('a'),
    x => x.replace('.0', '')
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
])

class Timeline extends React.Component {
  componentDidMount() {
    this.init()
    this.update()
  }

  componentDidUpdate(prevProps) {
    const update = (
      this.props.data !== prevProps.data
    )

    if (update) {
      this.update()
    }
  }

  init() {
    let { height: svgHeight } = this.props.opts

    if (!svgHeight) {
      svgHeight = 400
    }

    this.svg = d3.select(this.el)
      .append('svg')
      .attr('height', svgHeight)

    this.g = this.svg
      .append('g')
        .attr('transform', `translate(${d.MARGIN,d.MARGIN})`)

    this.periodsGBackground = this.g.append('rect')
    this.periodsG = this.g.append('g')

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
  }

  async update() {
    const { dataset, data } = this.props

    let min = Infinity
      , max = -Infinity

    const periods = await dataset.cachedSort(data, 'start')
        , _periods = []

    periods.forEach(period => {
      const earliest = earliestYear(period.start)
          , latest = latestYear(period.stop)

      if (earliest != null && earliest < min) min = earliest;
      if (latest != null && latest > max) max = latest

      _periods.push([earliest, latest])
    })

    this.scale.x.domain([domainUnit(min), domainUnit(max, false)])
    this.scale.y.domain([0, periods.length])

    const xAxis = d3.axisBottom()
      .scale(this.scale.x)
      .ticks(5)
      .tickFormat(yaTickFormat)

    this.axisG.x.transition().duration(256).call(xAxis)

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
  }

  render() {
    return (
      h('div', {
        ref: el => { this.el = el }
      })
    )
  }
}

module.exports = {
  label: 'D3 test',
  description: 'd3 component with init/update/destroy methods',
  Component: Timeline,
}
