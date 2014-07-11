"use strict";

var $ = require('jquery')
  , Backbone = require('../backbone')

require('jquery-typeahead');

module.exports = Backbone.View.extend({
  initialize: function () {
    var $ul;

    this.render();
    this.initTypeahead();

    $ul = this.$('ul');

    this.views = {};
    this.listenTo(this.collection, 'add', function (item) {
      var $el = $('<li>' + item.get('label') + '</li>').appendTo($ul);
      $('<button type="button" class="close">&times;</button>')
        .prependTo($el)
        .css('float', 'none')
        .css('margin-right', '6px')
        .on('click', function () {
          item.collection.remove(item);
        });
      this.views[item.cid] = $el;
    });

    this.listenTo(this.collection, 'remove', function (item) {
      this.views[item.cid].remove();
      delete this.views[item.cid];
    });
  },
  initTypeahead: function () {
    var that = this
      , $input
      , countries;

    $input = this.$('input');

    countries = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('label'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      local: require('../data/dbpedia_countries.json')
    });
    countries.initialize();

    $input
      .typeahead({
        hint: true,
        highlight: true,
        minLength: 1
      },
      {
        name: 'countries',
        displayKey: 'label',
        source: countries.ttAdapter(),
        templates: {
          suggestion: require('../templates/spatial_suggestion.html')
        }
      })
      .on('typeahead:selected', function (e, suggestion) {
        this.value = '';
        that.collection.add(suggestion);
      })
      .on('blur', function () {
        this.value = '';
      })
  },
  render: function () {
    var template = require('../templates/spatial_coverage.html');
    this.$el.html(template());
  }
});
