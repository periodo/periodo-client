"use strict";

const h = require('react-hyperscript')
    , ui = require('periodo-ui')
    , { ThemeProvider } = require('emotion-theming')

const UISection = props =>
  h(ui.Box, {
    sx: {
      border: '1px solid black',
      m: 4,
    },
    ...props,
  })

module.exports = function Test() {
  return (
    h(ThemeProvider, { theme: ui.theme }, [
      h(UISection, [
        h(ui.Heading, { level: 1 }, 'Heading level 1'),
        h(ui.Heading, { level: 2 }, 'Heading level 2'),
        h(ui.Heading, { level: 3 }, 'Heading level 3'),
        h(ui.Heading, { level: 4 }, 'Heading level 4'),
      ]),

      h(UISection, [
        h(ui.ResourceTitle, 'Resource title'),
        h(ui.SectionHeading, 'Section heading'),
        h(ui.Section, [
          'Section content',
          h('br'),
          h(ui.HelpText, 'Some help text'),
        ]),
      ]),
      h(UISection, [
        h(ui.Alert$Success, { my: 2 }, 'Success'),
        h(ui.Alert$Warning, { my: 2 }, 'Warning'),
        h(ui.Alert$Error, { my: 2 }, 'Error'),
      ]),
      h(UISection, [
        h(ui.Button$Primary, { m: 2 }, 'Primary button'),
        h(ui.Button$Danger, { m: 2 }, 'Danger button'),
        h(ui.Button$Default, { m: 2 }, 'Default button'),
        h(ui.AriaButton, { m: 2 }, 'Aria (fake) button'),
      ]),
    ])
  )
}
