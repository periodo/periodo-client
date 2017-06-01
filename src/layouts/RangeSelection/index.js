"use strict";

const d3 = require('d3')
    , Immutable = require('immutable')
    , makeRangeBins = require('./make_range_bins')

function RangeSelectionWidget(opts) {
  this.onChange = opts.onChange;

  this.width = opts.width || 210;
  this.height = opts.height || 180;

  this.dateRangeStart = null;
  this.dateRangeStop = null;

  this.hideOutliers = !!opts.hideOutliers;

  this.svg = d3.select(opts.el).insert('svg')
      .attr('width', this.width)
      .attr('height', this.height)

  const g = this.svg.append('g')
    .attr('transform', 'translate(20)')

  this.g = g.append('g');

  this.g.append('g')
    .attr('transform', `translate(0,${this.height - 37})`)
    .attr('class', 'x-axis')

  this.brushG = g.append('g').attr('class', 'brush')

  this.toolTip = g.append('rect')
    .attr('height', '20px')
    .attr('width', this.width - 60)
    .attr('fill', 'none');

  this.toolTipText = g.append('text')
    .attr('y', '20px')

  this.update(opts);
}

RangeSelectionWidget.prototype.getBins = function getBins(min, max) {
  const bins = makeRangeBins(this.data, 50, min, max)
    , count = this.data.size

  const redo = this.hideOutliers && (
    bins.slice(0, -1).every(bin => bin.get('count') / count < .05)
  );

  return redo ?
    getBins.call(this, bins.getIn([-1, 'earliest']), bins.getIn([-1, 'latest'])) :
    bins
}

RangeSelectionWidget.prototype.handleBrushEnd = function (start, end) {
  if (this.onChange) {
    this.onChange({ start, end });
  }
}

RangeSelectionWidget.prototype.update = function ({ data }) {
  this.data = data
    .get('periodCollections')
    .flatMap(c => c.get('definitions'))

  this.render();
}

RangeSelectionWidget.prototype.remove = function () {
  this.svg.remove();
}

RangeSelectionWidget.prototype.render = function () {
  const CIRCLE_RADIUS = 1
      , CIRCLE_SPACING = 1

  const roundNum = truncateNumber.bind(null, 2)

  let bins

  // FIXME: show something useful if we can't figure out bins (because, for
  // instance, there's no data). for now, the visualization just doesn't update
  // from its previous state.
  try {
    bins = this.getBins()
  } catch (err) {
    return null;
  }

  const dateRangeStart = bins.getIn([0, 'earliest'])
    , dateRangeStop = bins.getIn([-1, 'latest'])

  this.dateRangeStart = dateRangeStart;
  this.dateRangeStop = dateRangeStop;

  // Binning might hide some periods at the beginning; this includes those
  // hidden periods
  this.absoluteRange = bins._range;

  /*
   * X scale and axis
   ***/
  const xScale = d3.scaleLinear()
    .domain([dateRangeStart, dateRangeStop])
    .range([0, this.width - 60]);

  const [minYear, maxYear] = xScale.domain().map(roundNum);
  const commaFormat = d3.format(',');
  const noCommaFormat = d3.format('d');
  const xAxis = d3.axisBottom()
    .scale(xScale)
    .tickValues([roundNum(minYear), roundNum((minYear + maxYear) / 2), roundNum(maxYear)])
    .tickFormat(d => (d > 2500 || d < -999) ? commaFormat(d) : noCommaFormat(d))

  const axisG = this.g.select('g.x-axis').call(xAxis)

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
  const maxCount = Math.max.apply(null, bins.map(bin => bin.get('count')).toJS());
  const circleScale = d3.scaleLinear()
    .domain([0, maxCount])
    .range([0, Math.floor((this.height - 40) / (CIRCLE_RADIUS * 2 + CIRCLE_SPACING))])

  const yScale = d3.scaleLinear()
    .domain([circleScale(maxCount), 0])
    .range([0, this.height - 40])

  /*
   * Circles representing the bin counts
   ***/
  const dots = this.g.selectAll('circle')
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
  this.brush = d3.brushX()

  const toolTip = this.toolTip
    , toolTipText = this.toolTipText


  function updateTooltipText() {
    const x0 = xScale.invert(d3.mouse(this)[0]);
    toolTip.style('display', null);
    toolTipText.style('display', null);
    toolTipText.text(commaFormat(Math.floor(x0)));
  }

  function hideTooltip() {
    toolTip.style('display', 'none');
    toolTipText.style('display', 'none');
  }

  function showTooltip() {
    toolTip.style('display', null);
    toolTipText.style('display', null);
  }


  this.brushG
    .call(this.brush)
    .selectAll('rect')
    .attr('height', this.height - 37)
    .attr('opacity', '.3')
    .on('mouseover', showTooltip)
    .on('mouseout', hideTooltip)
    .on('mousemove', updateTooltipText)

  this.brush.on('brush', updateTooltipText);
  this.brush.on('end', () => {
    let [earliest, latest] = d3.event.selection.map(xScale.invert)

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


function truncateNumber(leftDigits, number) {
  const places = (Math.floor(Math.abs(number)) + '').length
      , power = Math.pow(10, places - (leftDigits || 2))
      , divided = number / power
      , rounded = (number > 0 ? Math.ceil : Math.floor)(divided)

  return rounded * power;
}

module.exports = {
  label: 'Range selector',
  description: 'Brushable histogram for a set of periods',
  renderer: {
    init(container, { data }) {
      this.widget = new RangeSelectionWidget({
        data,
        el: container
      })
    },

    update({ data }) {
      this.widget.update({ data });
    }
  }
}
