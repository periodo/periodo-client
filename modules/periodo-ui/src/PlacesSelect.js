"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { Box } = require('./Base')
    , { Link } = require('./Links')
    , { Tags } = require('./Tags')
    , { LabeledMap } = require('./LabeledMap')
    , { PlaceSuggest } = require('./PlaceSuggest')

const togglePlace = (toggled, places) => {

  const { newPlaces, addPlace } = places.reduce(
    ({ newPlaces, addPlace }, place) => {
      if (place.id === toggled.id) {
        return {
          newPlaces,
          addPlace: false,
        }
      } else {
        newPlaces.push(place)
        return {
          newPlaces,
          addPlace,
        }
      }
    },
    {
      newPlaces: [],
      addPlace: true,
    }
  )

  if (addPlace) {
    newPlaces.push(toggled)
  }

  return newPlaces
}

const PlacesSelect = ({
  onChange,
  coverage=[],    // [ { id, label } ]
  suggestions=[], // [ { id, label } ]
  gazetteers,
  closable=false,
}) => {

  const [ focusedFeature, setFocusedFeature ] = useState(null)

  const [ closed, setClosed ] = useState(closable ? true : false)

  const editLink = h(Link, {
    onClick: () => {
      setClosed(!closed)
      if (!closed) {
        setFocusedFeature(null)
      }
    },
    ml: 1,
  }, closed ? 'Select places' : 'Done')

  return h(Box, {}, [

    h(Tags, {
      items: coverage,
      suggestedItems: suggestions,
      editLink: closable ? editLink : null,
      emptyMessage: 'No places selected.',
      suggestedTagsLabel: 'Suggested places: ',
      onFocus: ({ id }) => {
        setFocusedFeature(gazetteers.find(id))
        setClosed(false)
      },
      onBlur: () => {
        setFocusedFeature(null)
      },
      onAcceptSuggestion: accepted => {
        onChange([ ...coverage, accepted ])
      },
      onDeleteItem: deleted => {
        onChange(coverage.filter(({ id }) => id !== deleted.id))
      },
    }),

    closed
      ? null
      : h(Box, { maxWidth: '600px' }, [

        h(LabeledMap, {
          focusedFeatures: focusedFeature ? [ focusedFeature ] : [],
          features: coverage.map(({ id }) => gazetteers.find(id)),
          mt: 1,
        }),

        h(PlaceSuggest, {
          gazetteers,
          inputProps: { autoFocus: true },
          onSuggestionHighlighted:
            ({ suggestion: feature }) => setFocusedFeature(feature),
          isSelected: feature => coverage.some(({ id }) => id === feature.id),
          onSelect: feature => {
            const place = {
              id: feature.id,
              label: feature.properties.title,
            }
            onChange(togglePlace(place, coverage))
          },
        }),
      ]),
  ])
}

exports.PlacesSelect = PlacesSelect
