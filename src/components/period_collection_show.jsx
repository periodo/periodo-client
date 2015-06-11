"use strict";

var React = require('react')
  , PeriodDetails
  , PeriodEditModal

PeriodEditModal = React.createClass({
  render: function () {
    var PeriodForm = require('./period_form.jsx')
    return (
      <div className="modal" style={{ display: 'block' }} >
        <div className="modal-dialog" style={{ width: '1000px' }}>
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={this.props.hide}><span>×</span></button>
              <h4 className="modal-title">Header</h4>
            </div>

            <div className="modal-body">
              <PeriodForm period={this.props.period} />
            </div>

            <div className="modal-footer">
              <button onClick={this.props.hide} className="btn btn-danger">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
});

PeriodDetails = React.createClass({
  getInitialState: function () {
    return { modalContainer: null, modal: null }
  },
  hideModal: function () {
    document.removeEventListener('click', this.handleHide);
    this.state.modalContainer.parentNode.removeChild(this.state.modalContainer);
    this.setState({ modalContainer: null, modal: null });
  },
  showModal: function () {
    var modalContainer = document.createElement('div')
      , modalEl = document.createElement('div')
      , modal

    modalContainer.style.position = 'absolute';
    modalContainer.style.background = 'rgba(0,0,0,0.5)';
    modalContainer.style.top = 0;
    modalContainer.style.height = document.body.scrollHeight + 'px';
    modalContainer.style.width = '100%';
    modalContainer.style.zIndex = '900';

    modalContainer.appendChild(modalEl);

    document.body.appendChild(modalContainer);
    document.addEventListener('click', this.handleHide, false);

    modal = React.createElement(PeriodEditModal, {
      hide: this.hideModal,
      period: this.props.period
    });
    modal = React.render(modal, modalEl);
    this.setState({ modal, modalContainer });
  },
  handleHide: function (e) {
    var { isChild } = require('../utils/dom')
      , el = React.findDOMNode(this.state.modal).querySelector('.modal-content')

    if (!isChild(e.target, el)) this.hideModal();
  },
  handleClick: function (e) {
    e.stopPropagation();
    this.showModal();
  },
  render: function () {
    var Period = require('./shared/period.jsx')

    return (
      <div>
        <h4>{this.props.period.get('label')}</h4>
        <div className="row">
          <div className="col-md-6">
            <Period period={this.props.period} />
          </div>
          <div className="col-md-6">
            <button onClick={this.handleClick} className="btn btn-primary">Edit</button>
          </div>
        </div>
      </div>
    )
  }
});

module.exports = React.createClass({
  render: function () {
    var PeriodList = require('../views/faceted_browser/period_list.jsx')
      , { getDisplayTitle } = require('../helpers/source')

    return (
      <div>
        <h2>{getDisplayTitle(this.props.collection.get('source'))}</h2>
        <PeriodList
            periods={this.props.collection.get('definitions')}
            PeriodDetails={PeriodDetails} />
      </div>
    )
  }
});
