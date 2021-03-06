/**
 * External dependencies
 */
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { range } from 'lodash';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import EmptyContent from 'components/empty-content';
import { fetchReviews } from 'woocommerce/state/sites/reviews/actions';
import {
	areReviewsLoading,
	areReviewsLoaded,
	getReviews,
	getTotalReviews
} from 'woocommerce/state/sites/reviews/selectors';
import { getReviewsCurrentPage, getReviewsCurrentSearch } from 'woocommerce/state/ui/reviews/selectors';
import { getSelectedSiteWithFallback } from 'woocommerce/state/sites/selectors';
import Pagination from 'components/pagination';
import ReviewCard from './review-card';
import ReviewsFilterNav from './reviews-filter-nav';
import { updateCurrentReviewsQuery } from 'woocommerce/state/ui/reviews/actions';

class ReviewsList extends Component {
	static propTypes = {
		siteId: PropTypes.number,
		currentStatus: PropTypes.string,
		currentSearch: PropTypes.string,
		currentPage: PropTypes.number,
		reviews: PropTypes.array,
		reviewsLoading: PropTypes.bool,
		reviewsLoaded: PropTypes.bool,
		total: PropTypes.number,
	};

	componentDidMount() {
		const { siteId, currentStatus } = this.props;
		const query = {
			page: 1,
			search: '',
			status: currentStatus,
		};
		this.props.updateCurrentReviewsQuery( this.props.siteId, { page: 1, search: '' } );
		if ( siteId ) {
			this.props.fetchReviews( siteId, query );
		}
	}

	componentWillReceiveProps( newProps ) {
		const { currentPage, currentSearch, currentStatus, siteId } = this.props;

		const hasAnythingChanged = (
			newProps.currentPage !== currentPage ||
			newProps.currentSearch !== currentSearch ||
			newProps.currentStatus !== currentStatus ||
			newProps.siteId !== siteId
		);
		if ( ! newProps.siteId || ! hasAnythingChanged ) {
			return;
		}

		const query = {
			page: newProps.currentPage,
			search: newProps.currentSearch,
			status: newProps.currentStatus,
		};
		if ( newProps.currentSearch !== currentSearch ) {
			this.props.updateCurrentReviewsQuery( siteId, { page: 1, status: 'any' } );
			query.page = 1;
			query.status = 'any';
		} else if ( newProps.currentStatus !== currentStatus ) {
			this.props.updateCurrentReviewsQuery( siteId, { page: 1, search: '' } );
			query.page = 1;
			query.search = '';
		}

		if ( '' !== query.search ) {
			query.status = 'any';
		}

		this.props.fetchReviews( newProps.siteId, query );
	}

	renderPlaceholders = () => {
		return range( 5 ).map( ( i ) => {
			return (
				<Card key={ i } className="reviews__card">
					<div className="reviews__placeholder">
					</div>
				</Card>
			);
		} );
	}

	renderNoContent = () => {
		const { currentSearch, currentStatus, translate } = this.props;
		let emptyMessage = translate( 'No pending reviews.' );
		let lineMessage = translate( 'Your queue is clear.' );
		if ( currentSearch ) {
			emptyMessage = translate( 'There are no reviews matching your search.' );
			lineMessage = '';
		} else if ( 'approved' === currentStatus ) {
			emptyMessage = translate( 'No approved reviews.' );
		} else if ( 'spam' === currentStatus ) {
			emptyMessage = translate( 'No spam reviews.' );
		} else if ( 'trash' === currentStatus ) {
			emptyMessage = translate( 'No deleted reviews.' );
		}

		return (
			<EmptyContent
				title={ emptyMessage }
				illustration="/calypso/images/comments/illustration_comments_gray.svg"
				illustrationWidth={ 150 }
				line={ lineMessage }
			/>
		);
	}

	renderReview = ( review, i ) => {
		const { siteId } = this.props;
		return (
			<ReviewCard
				key={ i }
				siteId={ siteId }
				review={ review }
				currentStatus={ this.props.currentStatus }
			/>
		);
	}

	renderReviews = () => {
		const { reviews, reviewsLoaded } = this.props;
		return (
			<div className="reviews__list">
				{ ! reviewsLoaded
					? this.renderPlaceholders()
					: reviews.map( this.renderReview )
				}
			</div>
		);
	}

	onPageClick = nextPage => {
		this.props.updateCurrentReviewsQuery( this.props.siteId, {
			page: nextPage,
			status: this.props.currentStatus,
		} );
	}

	render() {
		const {
			currentPage,
			currentStatus,
			reviews,
			reviewsLoaded,
			total,
		} = this.props;

		return (
			<div className="reviews__container">
				<ReviewsFilterNav status={ currentStatus } />

				{ ( ! reviewsLoaded || ( reviews && reviews.length ) )
					? this.renderReviews()
					: this.renderNoContent()
				}

				<Pagination
					page={ currentPage }
					perPage={ 10 }
					total={ total }
					pageClick={ this.onPageClick }
				/>
			</div>
		);
	}
}

export default connect(
	( state, props ) => {
		const site = getSelectedSiteWithFallback( state );
		const siteId = site ? site.ID : false;
		const currentPage = getReviewsCurrentPage( state, siteId );
		const currentSearch = getReviewsCurrentSearch( state, siteId );
		const currentStatus = props.currentStatus || 'pending';

		const query = {
			page: currentPage,
			search: currentSearch,
			status: currentStatus,
		};

		if ( '' !== currentSearch ) {
			query.status = 'any';
		}

		const reviews = getReviews( state, query, siteId ) || [];
		const reviewsLoading = areReviewsLoading( state, query, siteId );
		const reviewsLoaded = areReviewsLoaded( state, query, siteId );
		const total = getTotalReviews( state, query, siteId );

		return {
			currentPage,
			currentSearch,
			currentStatus,
			reviews,
			reviewsLoading,
			reviewsLoaded,
			siteId,
			total,
		};
	},
	dispatch => bindActionCreators( { fetchReviews, updateCurrentReviewsQuery }, dispatch )
)( localize( ReviewsList ) );
