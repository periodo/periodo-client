"use strict";

var Backbone = require('../backbone')
  , Dexie = require('Dexie')
  , genid = require('../utils/generate_skolem_id')
  , getMasterCollection = require('../master_collection')
  , N3 = require('n3')
  , stringify = require('json-stable-stringify')

module.exports = Backbone.View.extend({
  events: {
    'click #js-add-period': 'handleAddPeriod',
    'click .edit-period': 'handleEditPeriod',
    'click #period-list-options .nav-pills a': 'handleChangeFormat'
  },
  initialize: function () {
    this.render();
  },
  render: function () {
    var template = require('../templates/period_collection_show.html');
    this.$el.html(template({ periodCollection: this.model.toJSON() }));

    this.$periodAdd = this.$('#period-add');
    this.$periodList = this.$('#period-list');
    this.$addPeriodContainer = this.$('#add-period-container');
  },
  editPeriod: function (period, $row) {
    var that = this
      , prevData = period.toJSON()
      , $container

    this.$addPeriodContainer.hide();

    this.$periodList.find('table').addClass('editing').removeClass('table-hover');

    var PeriodEditView = require('./period_edit');
    var periodEditView = new PeriodEditView({ model: period });

    if ($row) {
      $row.hide();
      $container = Backbone.$('<tr>')
        .css('margin', 'auto')
        .hide()
      $container
        .append('<td colspan=6></td>').find('td')
        .append(periodEditView.$el)
      $container
        .insertBefore($row)
        .show(500)
    } else {
      periodEditView.$el.appendTo($container || this.$periodAdd);
    }

    periodEditView.$el.on('click', '#js-save-period', function () {
      var message;
      if (period.isValid()) {
        if (period.isNew()) {
          message = 'Created period ' + period.get('label');
          period.set('id', genid());
        } else {
          message = 'Edited period ' + period.get('label');
        }
        that.model.save(null, { validate: false, message: message }).then(function () {
          periodEditView.remove();
          that.render();
        });
      }
    });

    periodEditView.$el.on('click', '#js-cancel-period', function () {
      if (period.isNew()) {
        period.destroy();
      } else {
        period.set(prevData);
      }
      periodEditView.remove();
      that.render();
    });

    periodEditView.$el.on('click', '#js-delete-period', function () {
      var message = 'Deleted period ' + period.get('label');
      that.model.get('definitions').remove(period);
      that.model.save(null, { validate: false, message: message }).then(function () {
        periodEditView.remove();
        that.render();
      });
    });

  },
  handleAddPeriod: function () {
    var period = this.model.get('definitions').add({ start: {}, stop: {} });
    this.editPeriod(period);
  },
  handleEditPeriod: function (e) {
    var $row = this.$(e.currentTarget).closest('tr')
      , periodID = $row.data('period-id')
      , period = this.model.get('definitions').get(periodID)

    this.editPeriod(period, $row);
  },
  handleChangeFormat: function (e) {
    var that = this
      , $target
      , format

    e.preventDefault();
    e.stopPropagation();

    $target = Backbone.$(e.currentTarget);
    format = $target.data('type');

    $target.closest('li').addClass('active').siblings().removeClass('active');

    if (format === 'list') {
      var template = require('../templates/period_list.html');
      this.$periodList.html(template({ periods: that.model.toJSON().definitions }));
    } else if (format === 'ttl') {
      var $pre = Backbone.$('<pre>');
      this.toTurtle().then(function (result) {
        $pre.text(result);
        that.$periodList.html('').append($pre);
      });
    } else if (format === 'jsonld') {
      this.toJSONLD().then(function (result) {
        var $pre = Backbone.$('<pre>').text(stringify(result, { space: '  ' }));
        that.$periodList.html('').append($pre);
      });
    } else if (format === 'viz') {
      var View = require('./period_collection_viz')
        , view = new View({ model: this.model, el: this.$periodList })
    }

  },
  toJSONLD: function () {
    var that = this;

    return new Dexie.Promise(function (resolve, reject) {
      getMasterCollection().then(function (masterCollection) {
        var json = that.model.toJSON();
        json['@context'] = masterCollection.context;
        resolve(json);
      });
    });
  },
  toTurtle: function () {
    var that = this;

    return new Dexie.Promise(function (resolve, reject) {
      getMasterCollection().then(function (masterCollection) {
        var jsonld = require('jsonld');
        var json = that.model.toJSON();

        json['@context'] = masterCollection.context;
        jsonld.toRDF(json, function (err, dataset) {
          if (err) { reject(err) }
          var writer = N3.Writer({
            skos: 'http://www.w3.org/2004/02/skos/core#',
            dcterms: 'http://purl.org/dc/terms/',
            foaf: 'http://xmlns.com/foaf/0.1/',
            time: 'http://www.w3.org/2006/time#',
            xsd: 'http://www.w3.org/2001/XMLSchema#',
            periodo: 'http://perio.do/temporary/'
          });

          function processPart(part) {
            var val;

            if (part.type !== 'literal') return part.value;

            val = '"' + part.value.replace(/"/g, '\\"') + '"';
            if (part.datatype === 'http://www.w3.org/2001/XMLSchema#string') {
              // Good!
            } else if (part.datatype === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') {
              val += '@' + part.language;
            } else {
              val += '^^' + part.datatype;
            }

            return val;
          }

          function processTriple(triple) {
            return {
              subject: processPart(triple.subject),
              predicate: processPart(triple.predicate),
              object: processPart(triple.object)
            }
          }

          dataset['@default'].forEach(function (triple) {
            writer.addTriple(processTriple(triple));
          });

          writer.end(function (err, result) {
            if (err) { reject(err) }
            result = result
              .replace(/\n</g, '\n\n<')
              .replace(/(\n<.*?>) /g, "$1\n    ")

            resolve(result);
          });

        });
      });
    });
  }
});
