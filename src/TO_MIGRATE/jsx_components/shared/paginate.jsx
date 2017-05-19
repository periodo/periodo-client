"use strict";

var React = require('react')
  , Paginate = require('react-paginate')

module.exports = React.createClass({
  displayName: 'Paginator',

  propTypes: {
    numItems: React.PropTypes.number.isRequired,
    currentPage: React.PropTypes.number.isRequired,
    initialPage: React.PropTypes.number,
    limit: React.PropTypes.number.isRequired,
    onPageChange: React.PropTypes.func
  },


  handlePageChange(data) {
    this.props.onPageChange(data.selected);
  },


  getNumberOfPages() {
    var numItems = this.props.numItems;
    return numItems ? Math.ceil(numItems / this.props.limit) : 1;
  },


  render() {
    return (
      <Paginate containerClassName="pagination-container pagination"
                subContainerClassName="pages pagination"
                activeClass="active"
                forceSelected={this.props.currentPage}
                initialSelected={this.props.initialPage || 0}
                pageNum={this.getNumberOfPages()}
                marginPagesDisplayed={2}
                breakLabel={<li className="break"><a href="">...</a></li>}
                clickCallback={this.handlePageChange} />
    )
  }
});
