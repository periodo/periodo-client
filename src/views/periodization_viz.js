"use strict";

var height = 800
  , width = 1000

var _ = require('underscore')
  , Backbone = require('../backbone')
  , d3 = require('d3')

function assignLevels(seq) {
  var levels = []
    , ctr = []


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
  var data = _.chain(model.toJSON().definitions)
    .map(function (def) {
      var start = parseInt(def.start.in.year)
        , stop = parseInt(def.stop.in.year)

      return {
        level: 0,
        label: def.label,
        start: start,
        stop: stop,
        duration: stop - start
      }
    })
    .sortBy('duration')
    .reverse()
    .sortBy('start')
    .value()

  assignLevels(data);

  return data;
}

module.exports = Backbone.View.extend({
  initialize: function () {
    this.render();
  },
  render: function () {
    var data = formatData(this.model);

    var x = d3.scale.linear()
      .range([50, 950])
      .domain(_.map(this.model.getTimespan(), function (terminus) {
        return parseInt(terminus.get('year'), 10);
      }))
      .nice()

    this.$el.html('');

    var svg = d3.select(this.el).append('svg')
      .attr('height', height)
      .attr('width', width)

    this.svg = svg;

    var xAxis = d3.svg.axis().scale(x).orient('top')

    svg.append('g').call(xAxis).attr('transform', 'translate(0,20)')

    var rectHeight = 20
      , rectPadding = 20

    var filter = svg.append('filter')
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

    var periodSelect = svg.selectAll('.period').data(data)
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
      .append('title').text(function (d) { return d.label })

    periodSelect
      .append('text')
      .attr('x', function (d) { return x(d3.mean([d.start, d.stop])) })
      .attr('y', rectHeight)
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .text(function (d) { return d.label })

    periodSelect.on('mouseover', function () {
      if (d3.event.srcElement.nodeName === 'rect') {
        this.classList.add('hovering');
      }
    });

    periodSelect.on('mouseout', function () {
      this.classList.remove('hovering');
    });
  },
  remove: function () {
    this.svg.remove();
    Backbone.View.prototype.remove.apply(this, arguments);
  }
})
