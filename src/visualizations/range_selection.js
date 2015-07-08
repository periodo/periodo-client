"use strict";

var d3 = require('d3')
  , Immutable = require('immutable')

function RangeSelectionWidget(opts) {
  this.data = opts.data;
  this.onChange = opts.onChange;

  this.width = opts.width || 210;
  this.height = opts.height || 180;

  this.dateRangeStart = null;
  this.dateRangeStop = null;

  this.svg = d3.select(opts.el).insert('svg')
      .attr('width', this.width)
      .attr('height', this.height)

  var g = this.svg.append('g')
    .attr('transform', 'translate(20)')

  this.g = g.append('g');

  this.g.append('g')
    .attr('transform', `translate(0,${this.height - 37})`)
    .attr('class', 'x-axis')

  this.brushG = g.append('g').attr('class', 'brush')

  this.render();
}

// Fill out rightmost digits with zeros
function roundNum(num) {
  var places = (Math.abs(num) + '').length
    , power = Math.pow(10, places - 2)
    , divided = num / power
    , rounded = (num > 0 ? Math.ceil : Math.floor)(divided)

  return rounded * power;
}

RangeSelectionWidget.prototype.getBins = function getBins(min, max) {
  var { makeRangeBins } = require('../helpers/period_collection')
    , bins = makeRangeBins(this.data, 50, min, max)
    , count = this.data.size
    , redo

  redo = bins.slice(0, -1).every(bin => bin.get('count') / count < .02);

  return redo ?
    getBins.call(this, bins.getIn([-1, 'earliest']), bins.getIn([-1, 'latest'])) :
    bins
}

RangeSelectionWidget.prototype.handleBrushEnd = function (start, end) {
  if (this.onChange) {
    this.onChange({ start, end });
  }
}

RangeSelectionWidget.prototype.update = function (periods) {
  this.data = periods;
  this.render();
}

RangeSelectionWidget.prototype.remove = function () {
  this.svg.remove();
}

RangeSelectionWidget.prototype.render = function () {
  const CIRCLE_RADIUS = 1
      , CIRCLE_SPACING = 1

  var bins = this.getBins()
    , dateRangeStart = bins.getIn([0, 'earliest'])
    , dateRangeStop = bins.getIn([-1, 'latest'])

  this.dateRangeStart = dateRangeStart;
  this.dateRangeStop = dateRangeStop;

  // Binning might hide some periods at the beginning; this includes those
  // hidden periods
  this.absoluteRange = bins._range;

  /*
   * X scale and axis
   ***/
  var xScale = d3.scale.linear()
    .domain([dateRangeStart, dateRangeStop])
    .range([0, this.width - 60]);

  var [minYear, maxYear] = xScale.domain().map(roundNum);
  var commaFormat = d3.format(',');
  var noCommaFormat = d3.format('d');
  var xAxis = d3.svg.axis()
    .orient('bottom')
    .scale(xScale)
    .tickValues([roundNum(minYear), roundNum((minYear + maxYear) / 2), roundNum(maxYear)])
    .tickFormat(d => (d > 2500 || d < -999) ? commaFormat(d) : noCommaFormat(d))

  var axisG = this.g.select('g.x-axis').call(xAxis)

  axisG
    .select('path')
    .attr('fill', 'none')
    .attr('stroke', '#333')

  axisG
    .selectAll('text')
    .style('font-size', '11px')


  /*
   * Y scales. First one is to draw enough circles to fill chart
   ***/
  var maxCount = Math.max.apply(null, bins.map(bin => bin.get('count')).toJS());
  var circleScale = d3.scale.linear()
    .domain([0, maxCount])
    .range([0, Math.floor((this.height - 40) / (CIRCLE_RADIUS * 2 + CIRCLE_SPACING))])

  var yScale = d3.scale.linear()
    .domain([circleScale(maxCount), 0])
    .range([0, this.height - 40])

  /*
   * Circles representing the bin counts
   ***/
  var dots = this.g.selectAll('circle')
    .data(bins.toJS(), () => Math.random().toString());

  dots.exit().remove();

  dots.enter()
      .append('g')
      .selectAll('circle').data(d => {
        return Immutable.Repeat(d.earliest, Math.floor(circleScale(d.count))).toJS()
      })
        .enter()
      .append('circle')
      .attr('r', CIRCLE_RADIUS)
      .attr('cx', d => xScale(d))
      .attr('cy', (d, i) => yScale(i))
      .attr('fill', '#ddd')


  /*
   * Brush representing a year range
   ***/
  this.brush = d3.svg.brush()
    .x(xScale)

  this.brushG
    .call(this.brush)
    .selectAll('rect')
    .attr('height', this.height - 37)
    .attr('opacity', '.3')

  this.brush.on('brushend', () => {
    var [earliest, latest] = this.brush.extent()

    if (earliest === latest) {
      earliest = null;
      latest = null;
    } else {
      earliest = Math.floor(earliest);
      latest = Math.ceil(latest);
    }

    this.handleBrushEnd(earliest, latest);
  });
}

module.exports = RangeSelectionWidget;