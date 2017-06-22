"use strict";

const h = require('react-hyperscript')
    , { Box } = require('axs-ui')
    , { Source, SourceDiff } = require('lib/ui')
    , { generateRoute } = require('../router')
    , { getCurrentBackend } = require('../backends/utils')

const sourceA = {
  "locator": "page 561",
  "partOf": {
    "contributors": [
      {
        "id": "http://viaf.org/viaf/66565783",
        "name": "Hornblower, Simon."
      },
      {
        "id": "http://viaf.org/viaf/29582600",
        "name": "Spawforth, Antony (Antony J.S.)"
      }
    ],
    "citation": "Dawn Marie Hayes in Use for a Website on Norman Sicily",
    "id": "http://www.worldcat.org/oclc/783109160",
    "title": "The Oxford classical dictionary.",
    "yearPublished": 2003
  }
}

const sourceB = {
  "locator": "page 565",
  "partOf": {
    "creators": [
      {
        "id": "http://viaf.org/viaf/29582600",
        "name": "Spawforth, Antony (Antony J.S.)"
      }
    ],
    "contributors": [
      {
        "id": "http://viaf.org/viaf/66565783",
        "name": "Hornblower, Simon."
      }
    ],
    "id": "http://www.worldcat.org/oclc/783109960",
    "title": "The Cambridge classical dictionary.",
    "yearPublished": 2013
  }
}

module.exports = {
  '': {
    Component: h('div'),
    onBeforeRoute(dispatch, params, redirect) {
      const currentBackend = getCurrentBackend()

      redirect(!currentBackend
        ? generateRoute('available-backends')
        : generateRoute('backend', { backendID: currentBackend.asIdentifier() })
      )
    }
  },

  'test-source-diff': {
    Component: () => h(Box, [
      h(Source, { source: sourceA }),
      h(Source, { source: sourceB }),
      h(SourceDiff, { sourceA, sourceB })
    ])
  }
}
