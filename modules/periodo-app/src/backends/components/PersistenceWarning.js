"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { connect } = require('react-redux')
    , { Box, Button } = require('periodo-ui')
    , MainAction = require('../../main/actions')


const Paragraph = props => h(Box, {
  sx: {
    ':not(:last-of-type)': {
      mb: 4,
    },
  },
  fontSize: 16,
  ...props,
})


class PersistenceWarning extends React.Component {
  constructor() {
    super()

    this.requestEnablePushNotifications = this.requestEnablePushNotifications.bind(this)
    this.requestPersistence = this.requestPersistence.bind(this)
  }

  async requestEnablePushNotifications() {
    if (!window.Notification) {
      alert('Your browser does not support push notifications')
    }

    const result = await window.Notification.requestPermission()

    if (result === 'granted') {
      this.requestPersistence()
    } else {
      alert('You did not enable push notifications')
    }
  }

  async requestPersistence() {
    const { dispatch } = this.props

    await dispatch(MainAction.RequestPersistence)
  }

  render() {
    const { isPersisted, onAcknowledge } = this.props

    if (isPersisted) {
      return (
        h(Box, [
          h(Paragraph, [
            'Your browser is configured to persistently store data from PeriodO.',
          ]),
        ])
      )
    }

    return (
      h(Box, [
        h(Paragraph, [
          'Your browser does not currently allow ',
          h('a', {
            href: window.location.origin,
          }, window.location.origin),
          ' to store persistent data on your machine. Under certain circumstances, such as your hard disk running low on space, any information you save in this local data source could be deleted.',
        ]),

        h(Paragraph, [
          'If you are running Firefox, you can enable persistent storage by enabling ',
          h('a', {
            href: 'https://web.dev/persistent-storage/',
          }, ' persistent storage for this site.'),
          h('br'),
          h(Button, {
            mt: 1,
            onClick: () => {
              this.requestPersistence()
            },
          }, 'Enable persistent storage'),
        ]),

        h(Paragraph, [
          'If you are running the Chrome browser, you can enable persistent storage by enabling push notifications from ',
          h('a', {
            href: window.location.origin,
          }, window.location.origin),
          '. We will not send you any push notifications, but they must be enabled in order to persist storage.',
          h('br'),
          h(Button, {
            mt: 1,
            onClick: () => {
              this.requestEnablePushNotifications()
            },
          }, 'Enable push notifications'),
        ]),

        h(Paragraph, [
          'If you are running another browser, as of June 2020, there is no reliable way to ensure your data is persisted on the client. If you add or edit periods in this backend and want them to be preserved, you should periodically either backup this data source or submit your work as a patch to a remote data source.',
        ]),

        !onAcknowledge ? null : (
          h(Box, [
            h('Button', {
              onClick() { onAcknowledge() },
            }, 'OK'),
          ])
        ),
      ])
    )
  }
}

module.exports = connect(state => ({
  isPersisted: state.main.browser.isPersisted,
}))(PersistenceWarning)
