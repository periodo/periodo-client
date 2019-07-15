"use strict";

const h = require('react-hyperscript')
    , d3 = require('d3')
    , R = require('ramda')
    , React = require('react')
    , { earliestYear, latestYear } = require('periodo-utils/src/terminus')

const m = {
  l: 20,
  r: 20,
  t: 0,
  b: 20,
}

const PLOT_BG_COLOR = '#f9f9f9'

function getEndpoints(period) {
  const earliest = earliestYear(period.start)
      , latest = latestYear(period.stop)

  return [ earliest, latest ]
}

const _getEndpoints = R.memoizeWith(p => p.id, getEndpoints)

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

const visualizations = {
  Bars: require('./Bars'),
  Histogram: require('./Histogram')
}

const defaultVisualization = visualizations.Histogram

class Timeline extends React.Component {
  constructor (props) {
    super();

    const initialVisualization = (
      visualizations[props.opts.visualization] ||
      defaultVisualization
    )

    this.state = {
      visualization: new initialVisualization()
    }
  }

  componentDidMount() {
    this.initPlot()
    this.update()
  }

  componentDidUpdate(prevProps) {
    const newVisualization = (
      this.props.opts.visualization !== prevProps.opts.visualization
    )

    const newData = (
      this.props.data !== prevProps.data
    )

    if (newVisualization) {
      const nextVisualization = (
        visualizations[this.props.opts.visualization] ||
        defaultVisualization
      )

      if (this.state.visualization.destroy) {
        this.state.visualization.destroy()
      }

      this.plotG.remove()
      this.plotG = this.plotGParent.append('g')

      this.setState({
        visualization: new nextVisualization()
      }, this.update)
    } else if (newData) {
      this.update()
    }
  }

  initPlot() {
    let { height: heightFromOptions } = this.props.opts

    if (!heightFromOptions) {
      heightFromOptions = 400
    }

    const { width: containerWidth } = this.el.getBoundingClientRect()
        , containerHeight = heightFromOptions

    const plotWidth = containerWidth - m.l - m.r
        , plotHeight = containerHeight - m.t - m.b

    this.svg = d3.select(this.el)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)

    this.g = this.svg
      .append('g')
        .attr('transform', `translate(${m.t,m.l})`)

    this.plotBackground = this.g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', plotWidth)
      .attr('height', plotHeight)
      .attr('fill', PLOT_BG_COLOR)

    this.plotGParent = this.g.append('g')
    this.plotG = this.plotGParent.append('g')

    this.scale = {
      x: d3.scaleLinear().range([0, plotWidth]),
      y: d3.scaleLinear().range([plotHeight, 0]),
    }

    this.axisG = {
      x: this.g.append('g')
        .attr('transform', `translate(0,${plotHeight})`)
    }
  }

  async update() {
    const { dataset, data } = this.props
        , { visualization } = this.state

    let min = Infinity
      , max = -Infinity

    const sortedPeriods = await dataset.cachedSort(data, 'start')
        , periodsWithEndpoints = []

    sortedPeriods.forEach(period => {
      const [ earliest, latest ] = _getEndpoints(period)

      if (earliest != null && earliest < min) min = earliest;
      if (latest != null && latest > max) max = latest

      periodsWithEndpoints.push({ period, earliest, latest })
    })

    const xScale = this.scale.x
      .domain([domainUnit(min), domainUnit(max, false)])

    const yScale = this.scale.y
      .domain([0, sortedPeriods.length])

    const xAxis = d3.axisBottom()
      .scale(xScale)
      .ticks(5)
      .tickFormat(yaTickFormat)

    this.axisG.x.transition().duration(256).call(xAxis)

    visualization.update({
      xScale,
      yScale,
      group: this.plotG,
      periodsWithEndpoints,
    })
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
