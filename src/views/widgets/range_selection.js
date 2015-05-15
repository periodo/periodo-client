"use strict";

var d3 = require('d3')
  , Immutable = require('immutable')
  , { makeRangeBins } = require('../../helpers/period_collection')

function RangeSelectionWidget(opts) {
  this.data = opts.data;
  this.bins = makeRangeBins(this.data, 50);

  this.width = opts.width || 210;
  this.height = opts.height || 180;

  this.svg = d3.select(opts.el).insert('svg')
      .attr('width', this.width)
      .attr('height', this.height)

  this.g = this.svg.append('g')
    .attr('transform', 'translate(20)')

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

RangeSelectionWidget.prototype.remove = function () {
  this.svg.remove();
}

RangeSelectionWidget.prototype.render = function () {
  const CIRCLE_RADIUS = 1
      , CIRCLE_SPACING = 1


  /*
   * X scale and axis
   ***/
  var xScale = d3.scale.linear()
    .domain([this.bins.getIn([0, 'earliest']), this.bins.getIn([-1, 'latest'])])
    .range([0, this.width - 60]);

  var [minYear, maxYear] = xScale.domain().map(roundNum);
  var commaFormat = d3.format(',');
  var noCommaFormat = d3.format('d');
  var xAxis = d3.svg.axis()
    .orient('bottom')
    .scale(xScale)
    .tickValues([roundNum(minYear), roundNum((minYear + maxYear) / 2), roundNum(maxYear)])
    .tickFormat(d => (d > 2500 || d < -999) ? commaFormat(d) : noCommaFormat(d))

  var axisG = this.g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${this.height - 37})`)
    .call(xAxis)

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
  var maxCount = Math.max.apply(null, this.bins.map(bin => bin.get('count')).toJS());
  var circleScale = d3.scale.linear()
    .domain([0, maxCount])
    .range([0, Math.floor((this.height - 40) / (CIRCLE_RADIUS * 2 + CIRCLE_SPACING))])

  var yScale = d3.scale.linear()
    .domain([circleScale(maxCount), 0])
    .range([0, this.height - 40])

  /*
   * Circles representing the bin counts
   ***/
  var dots = this.g.selectAll('circle').data(this.bins.toJS());

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
/*
  this.brush = d3.svg.brush()
    .x(xScale)

  this.g.append('g')
    .attr('class', 'brush')
    .call(this.brush)
    .selectAll('rect')
    .attr('height', this.height - 37)
    .attr('opacity', '.3')
*/
}

module.exports = RangeSelectionWidget;
