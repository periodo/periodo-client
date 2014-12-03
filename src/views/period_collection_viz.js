"use strict";

var SVG_HEIGHT = 800
  , SVG_WIDTH = 800
  , SVG_PADDING = 30
  , SLIDER_HEIGHT = 125
  , SLIDER_PADDING = 12


var _ = require('underscore')
  , Backbone = require('../backbone')
  , d3 = require('d3')

function assignLevels(seq, focused) {
  var levels = []
    , ctr = []

  seq = _.chain(seq.slice())
    .sortBy('duration')
    .reverse()
    .sortBy('start')
    .value()

  if (focused) {
    seq = _.sortBy(seq, function (period) {
      if (period.stop === focused.start || period.start === focused.stop) {
        return 0;
      } else {
        return 1;
      }
    })
  }

  seq = seq.map(function (_period) {
    var period = _.extend(_period, {});

    for (var i = 0; i < levels.length; i++) {
      if (period.start >= levels[i]) break;
    }
    period.level = i;
    levels[i] = period.stop;

    if (!ctr.hasOwnProperty(i)) ctr[i] = 0;
    period.levelIndex = ctr[i];
    ctr[i] += 1;

    if (levels[i + 1] !== undefined && period.start >= levels[i + 1]) {
      levels.splice(i + 1);
    }

    return period;
  });

  if (focused) {
    seq.forEach(function (period) {
      if (period.data.id === focused.data.id) {
        period.level = 0;
      } else {
        period.level += 1;
      }
    });
  }

  return seq;
}

function formatData(model) {
  return _.map(model.toJSON().definitions, function (period) {
    var start = parseInt(period.start.in.year)
      , stop = parseInt(period.stop.in.year)

    return {
      start: start,
      stop: stop,
      duration: stop - start,
      data: period
    }
  })
}

function countriesFromData(data) {
  return _.chain(data)
    .reduce(function (acc, def) {
      def.data.spatialCoverage.forEach(function (space) {
        if (!acc.hasOwnProperty(space.label)) acc[space.label] = [];
        acc[space.label].push(def.data.id);
      })
      return acc;
    }, {})
    .map(function (val, key) {
      return { label: key, members: val }
    })
    .sortBy(function (d) { return d.members.length })
    .reverse()
    .value()
}

function filterData(data, filters, focused) {
  var ret = data.slice();

  function wrapped(filter) {
    return function (period) {
      if (focused && period.data.id === focused.data.id) return true;
      return filter(period);
    }
  }

  (filters ? filters.fns : []).forEach(function (filter) {
    ret = ret.filter(wrapped(filter));
  });
  return ret;
}

module.exports = Backbone.View.extend({
  events: {
    'change': function () { this.render() }
  },
  initialize: function () {
    this.$el.html('');

    this.svg = d3.select(this.el).append('svg')
      .attr('height', SVG_HEIGHT)
      .attr('width', SVG_WIDTH)

    this.first = true;
    this.initSlider();
    this.initPlot();
    this.render(true)
    this.first = false;
  },
  render: function (narrow) {
    var filters = this.getFilters()
      , data = this.getPlotData(filters)

    this.drawPlot(data, narrow);
    this.drawFilters(data, filters);
  },
  initPlot: function () {
    this.timeline = this.svg.append('g')
      .attr('class', 'timeline')
      .attr('transform', 'translate(0,' + (SLIDER_HEIGHT + SLIDER_PADDING) + ')')

    this.timeline.append('rect')
      .attr('height', SVG_HEIGHT - SLIDER_HEIGHT - SLIDER_PADDING)
      .attr('width', SVG_WIDTH)
      .attr('fill', '#f0f0f0')

    this.timeline.append('g')
      .attr('class', 'timeline-axis')
      .attr('transform', 'translate(0, ' + SVG_PADDING + ')')

    this.timeline.append('g')
      .attr('class', 'timeline-periods')

    this.filters = d3.select(this.el).insert('div', ':first-child')
      .style('float', 'right')
      .style('width', '300px')
      .style('min-height', SVG_HEIGHT + 'px')
      .style('background', '#f0f0f0')

    this.filters.append('h2').text('Filters').style('text-align', 'center');

    this.regionsFilter = this.filters.append('div');
    this.regionsFilter.append('h3').text('Regions')


    var hoverFilter = this.timeline.append('filter')
      .attr('id', 'hover-filter')
      .append('feComponentTransfer')
    hoverFilter.append('feFuncR')
      .attr('type', 'linear')
      .attr('intercept', '0.1')
      .attr('slope', '1')
    hoverFilter.append('feFuncG')
      .attr('type', 'linear')
      .attr('intercept', '0.1')
      .attr('slope', '1')
    hoverFilter.append('feFuncB')
      .attr('type', 'linear')
      .attr('intercept', '0.1')
      .attr('slope', '1')
  },
  initSlider: function () {
    var that = this
      , data = this.getPlotData()
      , x = this.getTimeScale(data)
      , xAxis = d3.svg.axis().scale(x).orient('bottom')
      , maxLevel = d3.max(data, function(d) { return d.level })
      , rectHeight = (SLIDER_HEIGHT - 25 - 12) / (maxLevel + 1)

    this.slider = this.svg.append('g')
      .attr('class', 'timeline-slider')


    this.slider.append('rect')
      .attr('height', SLIDER_HEIGHT)
      .attr('width', SVG_WIDTH)
      .attr('fill', '#f0f0f0')

    this.slider.append('g')
      .call(xAxis.ticks(5))
      .attr('transform', 'translate(0,' + (SLIDER_HEIGHT - 25) + ')');

    var brush = d3.svg.brush()
      .x(x)
      .on('brush', function () {
        that.brushExtent = brush.empty() ? null : brush.extent();
        that.render(true);
      });


    this.slider.append('g').selectAll('rect').data(data)
        .enter()
      .append('rect')
      .attr('x', function (d) { return x(d.start) })
      .attr('width', function (d) { return x(d.stop) - x(d.start) })
      .attr('height', rectHeight)
      .attr('fill', 'red')
      .attr('transform', function (d) {
        return 'translate(0,' + (((maxLevel - d.level) * rectHeight) + 12) + ')';
      });

    this.slider.append('g').call(brush)
      .selectAll('rect')
      .attr('height', SLIDER_HEIGHT - 25 - 12)
      .attr('y', 12)
      .attr('fill', 'blue')
      .attr('fill-opacity', 0.1)
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1)

  },
  getPlotData: function (filters) {
    var data = formatData(this.model)
      , focused = this.focusedEl && d3.select(this.focusedEl).datum()

    data = filterData(data, filters, focused);
    data = assignLevels(data, focused);

    return data;
  },
  getFilters: function () {
    var filters = { fns: [], regions: [] }

    if (this.focusedEl) {
      var data = d3.select(this.focusedEl).datum()
        , start = data.start - (data.duration * 0.1)
        , stop = data.stop + (data.duration * 0.1)

      filters.fns.push(function (period) {
        return (
          (period.start >= start && period.stop <= stop) ||
          (period.start < stop && period.start > start) ||
          (period.stop < stop && period.stop > start)
        );
      });
    }

    /*
    if (this.brushExtent) {
      var brush = this.brushExtent;
      filters.fns.push(function (period) {
        return (
          !(period.start > brush[1]) &&
          !(period.end < brush[0])
        )
      })
    }
    */

    this.$('.region-filter:checked').each(function (i, el) {
      filters.regions.push(el.value);
      filters.fns.push(function (period) {
        var coverage = period.data.spatialCoverage.map(function (sc) { return sc.label });
        return coverage.indexOf(el.value) !== -1;
      });
    });

    return filters;
  },
  getTimeScale: function (data, range, domain) {
    range = range || [SVG_PADDING, SVG_WIDTH - SVG_PADDING];
    domain = domain || data.reduce(function (acc, period) {
      if (period.start < acc[0]) acc[0] = period.start;
      if (period.stop > acc[1]) acc[1] = period.stop;
      return acc;
    }, [Infinity, -Infinity])

    return d3.scale.linear()
      .range(range)
      .domain(domain)
  },
  drawPlot: function (data, narrow) {
    var that = this;

    var rectHeight = 20
      , rectPadding = 20

    if (narrow) {
      this.x = this.getTimeScale(data, null, this.brushExtent);

      var xAxis = d3.svg.axis().scale(this.x).orient('top')
      this.timeline.select('.timeline-axis')
        .transition().duration(25)
        .call(xAxis);
    }

    var colorScale = d3.scale.category10().domain([0, 1, 2, 3]);
    function color(d) { return colorScale(d.levelIndex % 4) }

    var periods = this.timeline.select('.timeline-periods').selectAll('.period')
      .data(data, function (d) { return d.data.id })

    var periodsEnter = periods.enter()
      .append('g')
      .attr('class', 'period')
      .style('opacity', 0)
      .attr('transform', function (d) {
        var y = SVG_PADDING + 10 + (d.level * (rectHeight + rectPadding));
        return 'translate(0,' + y + ')';
      })

    periodsEnter
      .append('rect')
      .attr('height', rectHeight)
      .append('title').text(function (d) { return d.data.label })

    periodsEnter
      .append('text')
      .attr('y', rectHeight)
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .classed('no-select', true)
      .text(function (d) { return d.data.label })

    periodsEnter.on('mouseover', function () {
      if (d3.event.srcElement.nodeName === 'rect') {
        this.classList.add('hovering');
      }
    });

    periodsEnter.on('mouseout', function () {
      this.classList.remove('hovering');
    });

    periodsEnter.select('rect').on('dblclick', function () {
      var focusedEl = this.parentNode;
      that.focusedEl = that.focusedEl === focusedEl ? null : focusedEl;
      that.render(true);
      return false;
    });


    periods.exit()
      .transition().duration(50)
      .style('opacity', 0)
      .remove();

    periods.select('text')
      .attr('x', function (d) { return that.x(d3.mean([d.start, d.stop])) })

    periods.select('rect')
      .attr('fill', color)
      .transition().duration(25)
      .attr('width', function (d) { return that.x(d.stop) - that.x(d.start) })
      .attr('x', function (d) { return that.x(d.start) })

    periods
      .transition().delay(50).duration(50)
      .attr('transform', function (d) {
        var y = SVG_PADDING + 10 + (d.level * (rectHeight + rectPadding));
        return 'translate(0,' + y + ')';
      });

    periodsEnter
      .transition().delay(this.first ? 0 : 100).duration(50)
      .style('opacity', 1)
  },
  drawFilters: function (data, filters) {
    var countryData = countriesFromData(data);

    var countryScale = d3.scale.linear()
      .range([0, 100])
      .domain([0, d3.max(countryData, function (d) { return d.members.length })])

    var countrySelect = this.regionsFilter
      .selectAll('.country-filter').data(countryData, function (d) { return d.label })

    var countryEnter = countrySelect
          .enter()
      .append('div')
      .attr('class', 'country-filter')

    countryEnter
      .append('input')
      .attr('id', function (d, i) { return 'countryfilter-' + i })
      .attr('class', 'region-filter')
      .attr('value', function (d) { return d.label })
      .attr('type', 'checkbox')
      .style('margin', '0 3px 0 0')
      .style('padding', '0 3px 0 0')
      .style('vertical-align', 'middle')

    countryEnter
      .append('label')
      .attr('for', function (d, i) { return 'countryfilter-' + i })
      .style('display', 'inline-block')
      .style('width', '150px')
      .text(function (d) { return d.label })

    countryEnter
      .append('span')
      .attr('class', 'filter-level')
      .style('background', 'blue')
      .style('display', 'inline-block')
      .style('height', '1em')

    countrySelect.exit().remove();

    countrySelect
      .select('.filter-level')
      .style('width', function (d) { return countryScale(d.members.length) + 'px' })

    var checked = this.$('.country-filter input:checked')
      .map(function (i, el) { return el.value })
      .toArray();

    countrySelect
      .sort(function (a, b) {
        var aChecked = checked.indexOf(a.label) !== -1
          , bChecked = checked.indexOf(b.label) !== -1

        if (aChecked && bChecked) {
          return 0;
        } else if (aChecked) {
          return -1;
        } else if (bChecked) {
          return 1;
        }
      })
  },
  remove: function () {
    this.svg.remove();
    Backbone.View.prototype.remove.apply(this, arguments);
  }
})
