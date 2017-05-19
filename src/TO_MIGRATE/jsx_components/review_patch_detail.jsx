"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , jsonpatch = require('fast-json-patch')
  , Comments

Comments = React.createClass({
  propTypes: {
    comments: React.PropTypes.instanceOf(Immutable.List),
    orcidMap: React.PropTypes.object,
    patchURL: React.PropTypes.string.isRequired,
    onCommentAccepted: React.PropTypes.func
  },

  getInitialState() {
    return {
      comment: '',
      loading: false
    }
  },

  getDefaultProps() {
    return { comments: Immutable.List() }
  },

  handlePostComment() {
    var { ajax } = require('../ajax')
      , ajaxOpts

    ajaxOpts = {
      url: this.props.patchURL + 'messages',
      contentType: 'application/json',
      method: 'POST',
      headers: {},
      data: JSON.stringify({message: this.state.comment}),
      dataType: 'json'
    }

    if (localStorage.auth) {
      ajaxOpts.headers.Authorization = 'Bearer ' + JSON.parse(localStorage.auth).token;
    }

    this.setState({ loading: true });

    ajax(ajaxOpts)
      .then(
        () => {
          this.setState({
            comment: '',
            loading: false
          });
          this.props.onCommentAccepted();
        },
        ([xhr]) => {
          this.setState({ loading: false });
          if (xhr.status === 403) {
            alert('You do not have permission to merge patches.');
          } else if (xhr.status === 401) {
            alert('Bad authentication credentials. Sign out and sign back in.');
          } else {
            alert(xhr.responseText);
          }

          window.periodo.handleError(xhr.responseText);
          throw new Error(xhr.responseText);
        }
      )
  },

  render() {
    return (
      <div>
        <h3>Discussion</h3>

        <div className="well">
          Patch submitted by {this.props.orcidMap[this.props.patchData.created_by]}
          {' '}
          on {(new Date(this.props.patchData.created_at)).toLocaleString()}.
        </div>
        <hr />


        {
          this.props.comments.size > 0 && (
            this.props.comments.map(comment =>
              <div key={comment.hashCode()}>
                <h4>{this.props.orcidMap[comment.get('author')]}</h4>
                <div>{(new Date(comment.get('posted_at'))).toLocaleString()}</div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{comment.get('message')}</p>
                <hr />
              </div>
            )
          )
        }
        <div>
          <textarea
              rows="5"
              value={this.state.comment}
              onChange={e => this.setState({ comment: e.target.value })}
              className="form-control"
              placeholder="Add a new comment" />
          <br />
          <button
              disabled={!this.state.comment.length || this.state.loading}
              onClick={this.handlePostComment}
              className="btn btn-primary">
            Post
          </button>
        </div>
      </div>
    )
  }
});


module.exports = React.createClass({
  displayName: 'ReviewPatchDetail',


  getInitialState() {
    return {
      patchData: null,
      patchText: null,
      acceptPatch: null,
      submitting: false
    }
  },


  componentDidMount() {
    this.fetchData();
  },


  fetchPatch() {
    var { getJSON } = require('../ajax')
    return getJSON(this.props.patchURI);
  },


  refreshPatchData() {
    this.fetchPatch().then(([patchData]) => this.setState({ patchData }));
  },


  fetchData() {
    var { getJSON } = require('../ajax')
      , { getOrcids } = require('../utils/patch_collection')
      , fetchOrcids = require('../utils/fetch_orcids')

    this.fetchPatch()
      .then(([data]) => Promise.all([
        data,
        getJSON(data.text),
        getJSON(data.created_from),
        fetchOrcids(getOrcids(Immutable.fromJS([data])))
      ]))
      .then(([patchData, [patchText], [sourceData], orcids]) => this.setState({
        patchData,
        patchText,
        sourceData,
        orcids
      }))
  },


  handleChangeDecision(e) {
    this.setState({ acceptPatch: e.target.value === 'true' ? true : false });
  },


  handleMerge() {
    var { ajax } = require('../ajax')
      , ajaxOpts

    this.setState({ submitting: true });

    ajaxOpts = {
      url: this.state.patchData.url + (this.state.acceptPatch ? 'merge' : 'reject'),
      contentType: 'application/json',
      method: 'POST',
      headers: {},
      dataType: 'json'
    }

    if (localStorage.auth) {
      ajaxOpts.headers.Authorization = 'Bearer ' + JSON.parse(localStorage.auth).token;
    }

    ajax(ajaxOpts)
      .then(
        () => {
          this.setState({ submitting: false, successful: true });
        },
        ([xhr]) => {
          this.setState({ submitting: false });

          if (xhr.status === 403) {
            alert('You do not have permission to merge patches.');
          } else if (xhr.status === 401) {
            alert('Bad authentication credentials. Sign out and sign back in.');
          } else {
            alert(xhr.responseText);
          }

          window.periodo.handleError(xhr.responseText);
          throw new Error(xhr.responseText);
        }
      )
  },

  renderPatch() {
    var ChangeList = require('./shared/change_list')
      , patchData = this.state.patchData
      , destData

    if (!patchData.mergeable) {
      return <div className="alert alert-warning">Unable to merge patch</div>
    } else {

      destData = JSON.parse(JSON.stringify(this.state.sourceData));
      jsonpatch.apply(destData, this.state.patchText);

      return (
        <div>
              {
                this.state.successful ?
                  this.renderSuccessHeader() :
                  this.renderMergeHeader()
              }

          <div className="row">
            <div className="col-md-4">
              <Comments
                  patchData={this.state.patchData}
                  patchURL={this.state.patchData.url}
                  comments={Immutable.fromJS(patchData.comments)}
                  orcidMap={this.state.orcids}
                  onCommentAccepted={this.refreshPatchData} />
            </div>
            <div className="col-md-8">
              <ChangeList
                  select={false}
                  patches={Immutable.fromJS(this.state.patchText)}
                  sourceStore={Immutable.fromJS(this.state.sourceData)}
                  destStore={Immutable.fromJS(destData)} />
            </div>
          </div>
        </div>
      )
    }
  },

  renderSuccessHeader() {
    return (
      <div className="well">
        <p className="lead">
          {
            this.state.acceptPatch ?
              'Patch successfully merged.' :
              'Patch successfully rejected.'
          }
        </p>
      </div>
    )
  },

  renderMergeHeader() {
    var patchData = this.state.patchData

    return (
      <div className="well">
        {
          patchData.mergeable ?
            <p className="text-success lead">Able to merge patch.</p> :
            <p className="text-warning lead">Unable to merge patch against current dataset on server.</p>
        }

        <div className="has-success">
          <div className="radio">
            <label>
              { patchData.mergeable ? 'Accept patch' : <s>Accept patch</s> }
              <input
                  type="radio"
                  value={true}
                  checked={this.state.acceptPatch === true}
                  onChange={this.handleChangeDecision}
                  disabled={!patchData.mergeable} />
            </label>
          </div>
        </div>

        <div className="has-error">
          <div className="radio">
            <label>
              Reject patch
              <input
                  type="radio"
                  value={false}
                  checked={this.state.acceptPatch === false}
                  onChange={this.handleChangeDecision} />
            </label>
          </div>
        </div>

        <br />

        { this.renderMergeButton() }

        {
          this.state.acceptPatch === null ? '' : (
            <div>
              <br />
              <p className="help-block"><strong>This action cannot be undone</strong></p>
            </div>
          )
        }

      </div>
    )
  },

  renderMergeButton() {
    var btnClassMap = { null: 'default', true: 'primary', false: 'danger' }
      , btnTextMap = { null: 'Select an option', true: 'Accept', false: 'Reject' }

    return (
      <button
          onClick={this.handleMerge}
          disabled={this.state.acceptPatch === null || this.state.submitting}
          className={'btn btn-' + btnClassMap[this.state.acceptPatch]}>
        { btnTextMap[this.state.acceptPatch] }
      </button>
    )
  },

  render() {
    return (
      <div>
        <a className="btn btn-default" href={this.props.router.generate('review-patch-list')}>
          ‹ Back to list
        </a>
        <h2>Review patch</h2>
        { this.state.patchData && this.renderPatch() }
      </div>
    )
  }
});