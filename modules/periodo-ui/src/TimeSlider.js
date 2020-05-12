"use strict";

const h = require('react-hyperscript')
    , { Slider , Rail , Handles , Tracks } = require('react-compound-slider')
    , { Ticks } = require('react-compound-slider')
    , { Box } = require('./Base')

const domain = [
  {
    // 0
    label: '5Ga',
    year: -5000000000,
  },
  {
    // 1
    label: '5Ma',
    year: -5000000,
  },
  {
    // 2
    label: '500ka',
    year: -500000,
  },
  {
    // 3
    label: '50,000BC',
    year: -50000,
  },
  {
    // 4
    label: '5000BC',
    year: -5000,
  },
  {
    // 5
    label: '0',
    year: 0,
  },
  {
    // 6
    label: '1500',
    year: 1500,
  },
  {
    // 7
    label: '1950',
    year: 1950,
  },
  {
    // 8
    label: 'present',
    year: 2100,
  },
]

const defaultRange = [ 3, 8 ]

const toDomainRange = ([ minYear, maxYear ]) => {
  if (minYear === undefined || maxYear === undefined || minYear >= maxYear) {
    return defaultRange
  }
  const range = domain.reduce((range, value, index) => {
    if (minYear - value.year >= 0) range[0] = index
    if (maxYear - value.year >= 0) range[1] = index
    return range
  }, [ 0, domain.length - 1 ])
  return range
}

const toYearRange = domainRange => domainRange.map(i => domain[i].year)

const defaultYearRange = toYearRange(defaultRange)

const rootStyle = {
  position: 'relative',
  width: '100%',
  height: 80,
}

const StyledRail = props => h(Box, {
  position: 'absolute',
  width: '100%',
  height: 10,
  mt: '35px',
  borderRadius: 5,
  bg: 'gray.1',
  style: {
    cursor: 'pointer',
  },
  ...props,
})

const Handle = ({
  handle: { id, value, percent },
  getHandleProps,
}) => h(Box, {
  bg: 'blue.4',
  border: 0,
  borderRadius: '50%',
  color: '#333',
  height: 20,
  ml: '-9px',
  mt: '30px',
  position: 'absolute',
  textAlign: 'center',
  width: 20,
  style: {
    cursor: 'pointer',
    left: `${percent}%`,
    zIndex: 2,
  },
  ...getHandleProps(id),
}, [
  h(Box, {
    fontSize: 0,
    position: 'absolute',
    width: 100,
    ml: '-39px',
    mt: '-20px',
  }, [
    domain[value].label,
  ]),
])

const Track = ({
  source,
  target,
  getTrackProps,
}) => h(Box, {
  bg: 'blue.4',
  borderRadius: 5,
  height: 10,
  mt: '35px',
  position: 'absolute',
  width: `${target.percent - source.percent}%`,
  style: {
    cursor: 'pointer',
    left: `${source.percent}%`,
    zIndex: 1,
  },
  ...getTrackProps(),
})

const Tick = ({
  tick,
  count,
}) => h('div', [
  h(Box, {
    bg: 'gray.5',
    height: 8,
    ml: '-0.5px',
    mt: '50px',
    position: 'absolute',
    width: '1px',
    style: {
      left: `${tick.percent}%`,
    },
  }),
  h(Box, {
    fontSize: 10,
    ml: `${-(100 / count) / 2}%`,
    mt: '60px',
    position: 'absolute',
    textAlign: 'center',
    width: `${100 / count}%`,
    style: {
      left: `${tick.percent}%`,
    },
  }, [
    domain[tick.value].label,
  ]),
])

function TimeSlider({ yearRange=[], onChange }) {
  return h(Box, {
    pl: '10px',
    pr: '16px',
  }, [
    h(Slider, {
      rootStyle,
      domain: [ 0, domain.length - 1 ],
      step: 1,
      mode: 2,
      values: toDomainRange(yearRange),
      onChange: values => onChange(toYearRange(values)),
    }, [

      h(Rail, [
        ({ getRailProps }) => h(StyledRail, getRailProps()),
      ]),

      h(Handles, [
        ({ handles, getHandleProps }) => h('div',
          { className: 'slider-handles' },
          handles.map(handle => h(Handle, {
            key: handle.id,
            handle,
            getHandleProps,
          }))),
      ]),

      h(Tracks, {
        left: false,
        right: false,
      }, [
        ({ tracks, getTrackProps }) => h('div',
          { className: 'slider-tracks' },
          tracks.map(({ id, source, target }) => h(Track, {
            key: id,
            source,
            target,
            getTrackProps,
          }))),
      ]),

      h(Ticks, { count: domain.length }, [
        ({ ticks }) => h('div',
          { className: 'slider-ticks' },
          ticks.map(tick => h(Tick, {
            key: tick.id,
            count: ticks.length,
            tick,
          }))),
      ]),
    ]),
  ])
}

TimeSlider.getDefaultYearRange = () => [ ...defaultYearRange ]

exports.TimeSlider = TimeSlider
