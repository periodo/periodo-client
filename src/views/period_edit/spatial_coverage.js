"use strict";

var $ = require('jquery')
  , Backbone = require('../../backbone')

require('jquery-typeahead');

function getSpatialCoverages() {
  var Period = require('../../models/period');
  var objects = Period.all().toJSON().reduce(function (acc, period) {
    var desc = period.spatialCoverageDescription
      , countries
      , key

    if (desc) {
      countries = JSON.stringify(period.spatialCoverage);
      key = desc + countries;
      if (!(desc in acc)) {
        acc[desc] = {
          label: desc,
          uses: {}
        }
      }
      if (key in acc[desc].uses) {
        acc[desc].uses[key].count += 1
      } else {
        acc[desc].uses[key] = {
          count: 1,
          countries: JSON.parse(countries)
        }
      }
    }
    return acc;
  }, {});

  return Object.keys(objects).map(function (key) {
    var ret = objects[key];
    ret.uses = Object.keys(ret.uses).map(function (k) { return ret.uses[k] });
    return objects[key]
  });
}

module.exports = Backbone.View.extend({
  bindings: {
    '#js-spatialCoverageLabel': 'spatialCoverageDescription',
  },
  initialize: function () {

    this.render();
    this.stickit();
    this.initTypeahead();
    this.initCoverageType();

    this.$ul = this.$('ul');

    this.views = {};

    this.listenTo(this.collection, 'add', this._addItem);
    this.listenTo(this.collection, 'remove', function (item) {
      this.views[item.cid].remove();
      delete this.views[item.cid];
    });
    this.collection.forEach(this._addItem, this);
  },
  _addItem: function (item) {
    var that = this
      , $el = $('<li>' + item.get('label') + '</li>').appendTo(this.$ul)

    $('<button type="button" class="close">&times;</button>')
      .prependTo($el)
      .css('float', 'none')
      .css('margin-right', '6px')
      .on('click', function () {
        that.collection.remove(item);
      });
    this.views[item.cid] = $el;
  },
  initCoverageType: function () {
    var that = this
      , $input = this.$('#js-spatialCoverageLabel')
      , coverages


    coverages = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('label'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      local: getSpatialCoverages()
    })
    coverages.initialize();

    $input
      .typeahead({
        hint: true,
        highlight: true,
        minLength: 1
      },
      {
        name: 'coverages',
        displayKey: 'label',
        source: coverages.ttAdapter(),
        templates: {
          suggestion: require('./templates/spatial_description_suggestion.html')
        }
      })
      .on('typeahead:selected', function (e, suggestion) {
        var input = this;

        if (suggestion.uses.length === 1) {
          input.value = suggestion.label;
          that.collection.remove(that.collection.models);
          that.collection.add(suggestion.uses[0].countries);
          input.blur();
        } else {
          input.blur();
          var ModalView = require('./select_coverage_modal')
            , view = new ModalView({ suggestion: suggestion });

          view.$el.one('hide.bs.modal', function () {
            var selectedCountries = view.selectedCountries;
            if (selectedCountries) {
              that.collection.remove(that.collection.models);
              that.collection.add(selectedCountries);
            }
          });
        }
      });

    $input.closest('.twitter-typeahead').css('width', '100%');
  },
  initTypeahead: function () {
    var that = this
      , $input
      , countries

    $input = this.$('input.country-autocomplete');

    countries = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('label'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      local: require('../../data/dbpedia_countries.json')
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
          suggestion: require('./templates/spatial_suggestion.html')
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
    var template = require('./templates/spatial_coverage_form.html');
    this.$el.html(template());
  }
});
