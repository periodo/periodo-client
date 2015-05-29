"use strict";

var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  events: {
    'click #js-download-patch': 'handleDownloadPatch',
  },
  initialize: require('./select_patches').prototype.initialize,
  render: function () {
    var changeListTemplate = require('../templates/change_list')
      , html = changeListTemplate(this.patches, this.datasets, true)

    if (!html) {
      html = `<p>${this.noChangeMessage}</p>`;
    } else {
      html = `
        <div style="text-align: center;" class="col-md-2">
          <button id="js-download-patch" class="btn btn-default">Download patch file</button>
        </div>
      ` + html;
    }

    this.$el.html(html);
  },
  handleDownloadPatch: function () {
    var saveAs = require('filesaver.js')
      , filename = 'periodo-' + (new Date().toISOString()) + '.jsonpatch'
      , blob

    blob = new Blob(
      [JSON.stringify(this.selectedPatches, false, '  ')],
      { type: 'application/json-patch+json' }
    )

    saveAs(blob, filename);
  }
});
