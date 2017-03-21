const test = require('tape')
    , Immutable = require('immutable')


test('Period validation', t => {
  t.plan(5);

  const utils = require('../utils/period');

  const data = Immutable.fromJS({
    nothing: {},
    noDates: {
      label: 'Progressive Era'
    },
    mixedEndpoints: {
      label: 'Progressive Era',
      stop: { label: '1890', in: { year: '1890' }},
      start: { label: '1917', in: { year: '1917' }}
    },
    fine: {
      label: 'Progressive Era',
      start: { label: '1890', in: { year: '1890' }},
      stop: { label: '1917', in: { year: '1917' }}
    },
    zeroTerminus: {
      label: 'A Long Time Ago',
      start: { label: '2450 BP', in: { year: '-0500' }},
      stop: { label: '1950 BP', in: { year: '0000' }}
    }
  });

  t.deepEqual(utils.validate(data.get('nothing')), {
    label: ['This field is required.'],
    dates: ['A period must have start and stop dates.']
  });

  t.deepEqual(utils.validate(data.get('noDates')), {
    dates: ['A period must have start and stop dates.']
  });

  t.deepEqual(utils.validate(data.get('mixedEndpoints')), {
    dates: ["A period's stop must come after its start."]
  });

  t.deepEqual(utils.validate(data.get('fine')), null);

  t.deepEqual(utils.validate(data.get('zeroTerminus')), null);
});
