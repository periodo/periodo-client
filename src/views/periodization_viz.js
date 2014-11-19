"use strict";

var SVG_HEIGHT = 500
  , SVG_WIDTH = 800

var _ = require('underscore')
  , Backbone = require('../backbone')
  , d3 = require('d3')

function assignLevels(seq) {
  var levels = []
    , ctr = []

  seq = _.chain(seq.slice())
    .sortBy('duration')
    .reverse()
    .sortBy('start')
    .value()

  seq.forEach(function (period) {
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
  })
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

function filterData(data, filters) {
  var ret = data.slice()
  filters.forEach(function (filter) {
    ret = ret.filter(filter);
  });
  return ret;
}

module.exports = Backbone.View.extend({
  initialize: function () {
    this.render();
  },
  events: {
    'change': 'render'
  },
  getFilters: function () {
    var filters = [];

    this.$('.region-filter:checked').each(function (i, el) {
      filters.push(function (period) {
        var coverage = period.data.spatialCoverage.map(function (sc) { return sc.label });
        return coverage.indexOf(el.value) !== -1;
      })
    });

    return filters;
  },
  render: function () {
    var data = filterData(formatData(this.model), this.getFilters());
    assignLevels(data);

    var x = d3.scale.linear()
      .range([50, SVG_WIDTH - 50])
      .domain(_.map(this.model.getTimespan(), function (terminus) {
        return parseInt(terminus.get('year'), 10);
      }))
      .nice()

    this.$el.html('');

    var svg = d3.select(this.el).append('svg')
      .attr('height', SVG_HEIGHT)
      .attr('width', SVG_WIDTH)

    this.svg = svg;

    var timeline = svg.append('g').attr('class', 'timeline');

    timeline.append('rect')
      .attr('height', SVG_HEIGHT)
      .attr('width', SVG_WIDTH)
      .attr('fill', '#f0f0f0')

    var xAxis = d3.svg.axis().scale(x).orient('top')

    timeline.append('g').call(xAxis).attr('transform', 'translate(0,20)')

    var rectHeight = 20
      , rectPadding = 20

    var filter = timeline.append('filter')
      .attr('id', 'hover-filter')
      .append('feComponentTransfer')

    filter.append('feFuncR')
      .attr('type', 'linear')
      .attr('intercept', '0.1')
      .attr('slope', '1')
    filter.append('feFuncG')
      .attr('type', 'linear')
      .attr('intercept', '0.1')
      .attr('slope', '1')
    filter.append('feFuncB')
      .attr('type', 'linear')
      .attr('intercept', '0.1')
      .attr('slope', '1')

    var periodSelect = timeline.append('g').selectAll('.period').data(data)
        .enter()
      .append('g')
      .attr('class', 'period')
      .attr('transform', function (d) {
        var y = 30 + (d.level * (rectHeight + rectPadding));
        return 'translate(0,' + y + ')';
      })

    var colorScale = d3.scale.category10().domain([0, 1, 2]);
    function color(d) { return colorScale(d.levelIndex % 3) }

    periodSelect
      .append('rect')
      .attr('height', rectHeight)
      .attr('width', function (d) { return x(d.stop) - x(d.start) })
      .attr('fill', color)
      .attr('x', function (d) { return x(d.start) })
      .append('title').text(function (d) { return d.data.label })

    periodSelect
      .append('text')
      .attr('x', function (d) { return x(d3.mean([d.start, d.stop])) })
      .attr('y', rectHeight)
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .text(function (d) { return d.data.label })

    periodSelect.on('mouseover', function () {
      if (d3.event.srcElement.nodeName === 'rect') {
        this.classList.add('hovering');
      }
    });

    periodSelect.on('mouseout', function () {
      this.classList.remove('hovering');
    });


    var filters = d3.select(this.el).insert('div', ':first-child')
      .style('float', 'right')
      .style('width', '300px')
      .style('min-height', SVG_HEIGHT + 'px')
      .style('background', '#f0f0f0')

    filters.append('h2').text('Filters').style('text-align', 'center');
    filters.append('hr');

    var countryData = countriesFromData(data);

    var countryScale = d3.scale.linear()
      .range([0, 100])
      .domain([0, d3.max(countryData, function (d) { return d.members.length })])

    var countries = filters.append('div');
    countries.append('h3').text('Regions');

    var countrySelect = countries.selectAll('div').data(countryData).enter().append('div');

    countrySelect
      .append('input')
      .attr('class', 'region-filter')
      .attr('value', function (d) { return d.label })
      .attr('type', 'checkbox')
      .style('margin', '0 3px 0 0')
      .style('padding', '0 3px 0 0')
      .style('vertical-align', 'middle')

    countrySelect
      .append('span')
      .style('display', 'inline-block')
      .style('width', '150px')
      .text(function (d) { return d.label })

    countrySelect
      .append('span')
      .style('background', 'blue')
      .style('display', 'inline-block')
      .style('height', '1em')
      .style('width', function (d) { return countryScale(d.members.length) + 'px' })


    
  },
  remove: function () {
    this.svg.remove();
    Backbone.View.prototype.remove.apply(this, arguments);
  }
})
