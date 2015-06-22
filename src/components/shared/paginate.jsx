"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , Paginate = require('react-paginate')

module.exports = React.createClass({
  displayName: 'Paginator',

  propTypes: {
    numItems: React.PropTypes.number.isRequired,
    currentPage: React.PropTypes.number.isRequired,
    limit: React.PropTypes.number.isRequired,
    onPageChange: React.PropTypes.func
  },

  handlePageChange: function (data) {
    this.props.onPageChange(data.selected);
  },

  getNumberOfPages: function () {
    var numItems = this.props.numItems;
    return numItems ? Math.ceil(numItems / this.props.limit) : 1;
  },

  render: function () {
    return (
      <Paginate containerClassName="pagination-container pagination"
                subContainerClassName="pages pagination"
                activeClass="active"
                forceSelected={this.props.currentPage}
                pageNum={this.getNumberOfPages()}
                marginPagesDisplayed={2}
                breakLabel={<li className="break"><a href="">...</a></li>}
                clickCallback={this.handlePageChange} />
    )
  }
});
