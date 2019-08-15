"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { Box, Span } = require('./Base')
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
  places=[], // [ { id, label } ]
  gazetteers,
}) => {

  const [ focusedFeature, setFocusedFeature ] = useState(null)

  const [ closed, setClosed ] = useState(true)

  const editLink = h(Link, {
    onClick: () => {
      setClosed(!closed)
      if (!closed) {
        setFocusedFeature(null)
      }
    },
    css: { cursor: 'pointer' },
    ml: 1,
  }, closed ? 'Select places' : 'Done')

  return h(Box, {}, [

    places.length > 0
      ? h(Tags, {
        items: places,
        editLink,
        onFocus: ({ id }) => {
          setFocusedFeature(gazetteers.find(id))
          setClosed(false)
        },
        onBlur: () => {
          setFocusedFeature(null)
        },
        onDelete: deleted => {
          onChange(places.filter(({ id }) => id !== deleted.id))
        },
      })
      : h(Box, {
        height: '24px',
        css: {
          lineHeight: '24px',
        },
      }, [
        h(Span, {
          color: 'gray.6',
        }, 'No places selected.'),
        editLink,
      ]),

    closed
      ? null
      : h(Box, { maxWidth: '600px' }, [

        h(LabeledMap, {
          focusedFeatures: focusedFeature ? [ focusedFeature ] : [],
          features: places.map(({ id }) => gazetteers.find(id)),
          mt: 1,
        }),

        h(PlaceSuggest, {
          gazetteers,
          inputProps: { autoFocus: true },
          onSuggestionHighlighted:
            ({ suggestion: feature }) => setFocusedFeature(feature),
          isSelected: feature=> places.some(({ id }) => id === feature.id),
          onSelect: feature => {
            const place = {
              id: feature.id,
              label: feature.properties.title,
            }
            onChange(togglePlace(place, places))
          },
        }),
      ]),
  ])
}

exports.PlacesSelect = PlacesSelect
