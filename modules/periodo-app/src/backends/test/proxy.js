"use strict"

const test = require('blue-tape')
    , DatasetProxy = require('../dataset_proxy')

const danglingRelatedPeriodsDataset = {
  authorities: {
    p0123: {
      id: 'p0123',
      periods: {
        p0123a: {
          id: 'p0123a',
          broader: 'p0123d',
          derivedFrom: [
            'p0123b',
            'p0123c',
          ],
        },
        p0123b: {
          id: 'p0123b',
          broader: 'p0123a',
        },
      },
    },
  },
}

test('Dataset proxy validation', async t => {
  const dataset = new DatasetProxy(danglingRelatedPeriodsDataset)

  t.deepEqual(
    dataset.validated,
    {
      type: 'rdf:Bag',
      authorities: {
        p0123: {
          id: 'p0123',
          periods: {
            p0123a: {
              id: 'p0123a',
              derivedFrom: [
                'p0123b',
              ],
            },
            p0123b: {
              id: 'p0123b',
              broader: 'p0123a',
            },
          },
        },
      },
    }, 'should filter out related periods that do not exist')
})
