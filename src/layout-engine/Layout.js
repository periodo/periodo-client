"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('axs-ui')
    , { isReactComponent } = require('./utils')


module.exports = class Layout extends React.Component {
  componentWillUpdate(nextProps) {
    const { layout } = this.props

    // Layout type has changed
    if (nextProps.name !== this.props.name) {
      // Unmount existing non-react layout
      if (this._nonReactLayoutRenderer) {
        this.unmountNonReactComponent.call(this);
      }

      // If layout is not a react component, mount it
      if (!isReactComponent(layout.renderer)) {
        this.mountNonReactComponent.call(this);
      }
    }
  }

  componentDidMount() {
    const { layout } = this.props

    if (!isReactComponent(layout.renderer)) {
      this.mountNonReactComponent.call(this);
    }
  }

  mountNonReactComponent() {
    const { layout } = this.props
        , { container } = this.refs
        , renderer = this._nonReactLayoutRenderer = Object.create(layout.renderer)

    renderer.init.call(renderer, container, this.getChildProps());
  }

  getChildProps() {
    return {
      opts: this.props.opts,
      stream: this.props.stream,
      derivedOpts: this.props.derivedOpts,
    }
  }

  unmountNonReactComponent() {
    const { container } = this.refs

    Array.from(container.childNodes).forEach(el => {
      container.removeChild(el);
    })

    delete this._nonReactLayoutRenderer;
  }

  render() {
    const { renderer } = this.props.layout

    return (
      h(Box, this.props, [
        isReactComponent(renderer)
          ? h(renderer, this.getChildProps())
          : h('div', { ref: 'container' }),
      ])
    )
  }
}
