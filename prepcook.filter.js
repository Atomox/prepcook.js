/**
 * @file
 *   prepcook.filter
 *
 *   This module contains filter/format functions for formatting tokens
 *   from prepcook.token.js.
 */

var parseutil = parseutil || require('./includes/prepcook.utils');

const BISTRO_FAILURE = BISTRO_FAILURE || '__FAILURE';


var prepcookFilter = (function FilterFactory() {

	/**
	 * Format a number as the given currency format.
	 *
	 * @see https://www.currency-iso.org/en/home/tables/table-a1.html
	 *   for currency codes.
	 * 
	 * @param  {number} number
	 *   The number to be formatted. May be into or decimal.
	 * @param  {string} type
	 *   The type of currency this should be formatted to.
	 *   
	 * @return {string}
	 *   The number, formatted to the passed currency [type],
	 *   if supported. At worst, the original number passed.
	 */
	function filterCurrency (number, type) {

		console.log('filterCurrency: ', number, ',', type);

		var symbol = '',
			dec = 2;

		switch (type) {

			case 'USD':
			case 'EUR':
			case 'GBP':
			case 'JPY':
			case 'INR':
			case 'CNY':
				break;

			default:
				console.warn(type + ' is not a recgonized currency format.');
				return number;
		}

		return number.toLocaleString('en-US', {style: 'currency', minimumFractionDigits: dec, currency: type});
	}


	/**
	 * Given a date, format as the passed [format].
	 * 
	 * @param  {date} date
	 *   A date to format.
	 * @param  {string} format
	 *   A format which we should apply to our [date].
	 * 
	 * @return {string}
	 *   Our [date], in the specified format.
	 */
	function filterDate (date, format) {


		/**
		   

		   @TODO


		 */

		return date;
	}


	/**
	   
	   @TODO

	 * @param  {mixed} object
	 *   Some variables or object to convert to JSON.
	 * 
	 * @return {JSON}
	 *   Our data, in JSON format.
	 */
	function filterToJSON (object) {
		return JSON.stringify(object);
	}

	return {
		currency: filterCurrency,
		date: filterDate,
		json: filterToJSON
	};
})();

module.exports = {
	currency: prepcookFilter.currency,
	date: prepcookFilter.date,
	json: prepcookFilter.json
};