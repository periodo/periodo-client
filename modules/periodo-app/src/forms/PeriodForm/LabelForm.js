"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , tags = require('language-tags')
    , LocalizedLabelInput = require('./LocalizedLabelInput')
    , { alternateLabels } = require('periodo-utils/src/period')
    , { RandomID } = require('periodo-utils/src/hoc')
    , { Box } = require('periodo-ui')
    , { Label } = require('periodo-ui')

const defaultLabel = () => ({
  label: '',
  languageTag: 'en',
})

const lexvoURL = 'http://lexvo.org/id'

function lexvoLanguageURL(tag) {
  if (tag.length === 2) {
    return `${lexvoURL}/iso639-1/${tag}`
  }

  if (tag.length === 3) {
    return `${lexvoURL}/iso639-3/${tag}`
  }

  return null
}

function lexvoScriptURL(tag) {
  if (tag) {
    return `${lexvoURL}/script/${tag}`
  }

  return null
}

class LabelForm extends React.Component {
  constructor() {
    super();

    this.state = {}

    this.updateLocalizedLabels = this.updateLocalizedLabels.bind(this);
    this.addLabelAfter = this.addLabelAfter.bind(this);
    this.removeLabelAt = this.removeLabelAt.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    if (state.alternateLabels) return null;

    return {
      counter: 1,
      alternateLabels: alternateLabels(props.period),
    }
  }

  updateLocalizedLabels() {
    const { onValueChange, period } = this.props
        , { alternateLabels } = this.state

    onValueChange(
      R.set(
        R.lensProp('localizedLabels'),
        R.pipe(
          R.filter(R.prop('label')),
          R.groupBy(R.prop('languageTag')),
          R.map(R.map(R.prop('label')))
        )(alternateLabels),
        period
      )
    )
  }

  addLabelAfter(i) {
    const { counter, alternateLabels } = this.state
        , after = alternateLabels[i]

    const newLabel = R.pipe(
      R.assoc('label', ''),
      R.assoc('counter', counter),
    )(after || defaultLabel())

    // We don't need to call onValueChange after the state is updated, like in
    // `removeLabelAt`, since this will be a blank label that shouldn't be part
    // of the final period.
    this.setState({
      alternateLabels: R.insert(i + 1, newLabel, alternateLabels),
      counter: counter + 1,
    })
  }

  removeLabelAt(i) {
    const { alternateLabels } = this.state

    this.setState({
      alternateLabels: alternateLabels.length === 1
        ? R.assocPath([0, 'label'], '', alternateLabels)
        : R.remove(i, 1, alternateLabels)
    }, this.updateLocalizedLabels)
  }

  render() {
    const { randomID, period, onValueChange } = this.props

    let { alternateLabels } = this.state

    if (!alternateLabels.length) {
      alternateLabels = [defaultLabel()]
    }

    return (
      h(Box, [
        h(Label, {
          htmlFor: randomID('label'),
          isRequired: true,
        }, 'Original label'),

        h(LocalizedLabelInput, {
          id: randomID('label'),
          label: period.label || '',
          languageTag: period.languageTag || 'en',
          onValueChange: ({ label, languageTag }) => {
            const tag = tags(languageTag)
                , language = lexvoLanguageURL(tag.language().format())
                , script = lexvoScriptURL(tag.script())

            onValueChange(
              R.pipe(
                R.assoc('label', label),
                R.assoc('languageTag', languageTag),
                language
                  ? R.assoc('language', language)
                  : R.dissoc('language'),
                script
                  ? R.assoc('script', script)
                  : R.dissoc('script')
              )(period)
            )
          },
        }),

        h(Label, {
          mt: 2,
          htmlFor: randomID('alt-labels')
        }, 'Alternate labels'),

        alternateLabels.map((label, i) =>
          h(LocalizedLabelInput, {
            key: label.counter ? `new-${label.counter}` : i,
            label: label.label,
            languageTag: label.languageTag,
            mb: 1,
            onValueChange: value => {
              this.setState({
                // I would just set the new label directly, but I want to
                // preserve the `counter` property, so merging it is.
                alternateLabels: R.adjust(
                  R.flip(R.merge)(value), i, alternateLabels
                )
              }, this.updateLocalizedLabels)
            },
            addLabelAfter: () => this.addLabelAfter(i),
            removeLabelAt: () => this.removeLabelAt(i),

          })
        )
      ])
    )
  }
}

module.exports = RandomID(LabelForm)
