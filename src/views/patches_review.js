"use strict";

var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  events: {
    'click #js-download-patch': 'handleDownloadPatch',
  },
  initialize: function ({ acceptText, acceptButtonText }) {
    this.texts = { acceptButtonText, acceptText };
    require('./select_patches').prototype.initialize.apply(this, arguments);
  },
  render: function () {
    var changeListTemplate = require('../templates/change_list')
      , html = changeListTemplate(this.patches, this.datasets, true)

    if (!html) {
      html = `<p>${this.noChangeMessage}</p>`;
    } else {
      html = `
        <br />
        <div class="well">
          <div class="row">
            <div class="col-md-10">
              <p class="lead">${this.texts.acceptText}</p>
              <button id="js-accept-reviewed-patches" class="btn btn-primary">
                ${this.texts.acceptButtonText}
              </button>
            </div>
            <div style="text-align: center;" class="col-md-2">
              <button id="js-download-patch" class="btn btn-default">Download patch file</button>
            </div>
          </div>
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
      [JSON.stringify(this.patches, false, '  ')],
      { type: 'application/json-patch+json' }
    )

    saveAs(blob, filename);
  }
});
