"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'PreformattedFile',

  propTypes: {
    filename: React.PropTypes.string.isRequired,
    mimetype: React.PropTypes.string.isRequired,
    getFileContent: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return { loading: true, fileContent: null }
  },

  componentDidMount() {
    Promise.resolve(this.props.getFileContent())
      .then(fileContent => this.setState({ fileContent, loading: false }))
  },

  handleDownloadFile() {
    var saveAs = require('filesaver.js')
      , blob

    blob = new Blob([this.state.fileContent], { type: this.props.mimetype });
    saveAs(blob, this.props.filename);
  },

  render() {
    var Spinner = require('./spinner.jsx')

    return (
      <div>
        { this.state.loading && <Spinner spin={true} /> }

        {
          !this.state.loading && this.state.fileContent && (
            <div>
              <p>
                <a href="" onClick={this.handleDownloadFile}>
                  <img style={{
                    height: '22px',
                    marginRight: '6px'
                  }} src="lib/noun_433_cc.svg" />
                </a>
                {this.props.filename}
              </p>
              <pre className="preformatted-file-display">
                { this.state.fileContent }
              </pre>
            </div>
          )
        }
      </div>
    )
  }
});
