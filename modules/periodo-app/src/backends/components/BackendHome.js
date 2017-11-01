"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Text } = require('axs-ui')
    , { parseSpec } = require('org-layouts')
    , AuthorityLayout = require('../../layouts/authorities')

const specLength = R.path(['opts', 'spec', 'blocks', 'length'])

const defaultSpec = parseSpec(`
grid-gap = 1em 2.5em
grid-template-columns = 1fr 1fr

[HumanTime]
name = humans
grid-column = 2/3
grid-row = 1/2

[Search]
name = text
grid-column = 1/2
grid-row = 1/2

[PeriodList]
name = list
grid-column = 1/2
grid-row = 2/3
limit = 10

[Timeline]
name = test
grid-column = 2/3
grid-row = 2/3
`)

module.exports = class BackendHome extends React.Component {
  constructor() {
    super();

    this.state = {
      addAt: null,
    }
  }

  componentDidUpdate(prevProps) {
    if (specLength(prevProps) !== specLength(this.props)) {
      this.setState({ addAt: null })
    }
  }

  render() {
    const { backend, dataset, updateOpts } = this.props
        , { spec=defaultSpec } = this.props.opts

    return (
      h(Box, [
        h(Flex, {
          justifyContent: 'space-around',
          pb: 2,
        }, [
          h(Text, { mx: 1 }, [
            'Created: ' + new Date(backend.metadata.created).toLocaleString(),
          ]),

          h(Text, { mx: 1 }, [
            'Last modified: ' + new Date(backend.metadata.modified).toLocaleString(),
          ]),

          h(Text, { mx: 1 }, [
            'Last accessed: ' + new Date(backend.metadata.accessed).toLocaleString(),
          ]),

        ]),

        h(Box, { pt: 2 }, [
          h(AuthorityLayout, {
            spec,
            backend,
            dataset,
            onSpecChange: (spec, updatedBlock, updatedOpts) => {
              updateOpts(R.set(R.lensProp('spec'), spec))
            }
          }),
        ]),
      ])
    )
  }
}
